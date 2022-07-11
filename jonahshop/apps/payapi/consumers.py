import json
import time

from oscar.core.loading import get_model
from oscar.apps.payment.models import Source
from oscar.apps.order.models import Order as OsOrder
from channels.generic.websocket import WebsocketConsumer

from apps.payapi.momo import Momo


Order: OsOrder = get_model('order', 'Order')


class PaymentConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()

    def receive(self, text_data):
        data = json.loads(text_data)
        try:
            momo_number = data['momo_number']
        except KeyError:
            self.send_no_momo_number()
            return
        try:
            order_number = data['order_number']
            order = Order.objects.get(number=order_number)
        except KeyError:
            # This shouldn't happen, but we guard agaist it anyways
            self.send_no_order_number()
            return
        except Order.DoesNotExist:
            # This should not happend either, anyways respond and close websocket
            self.send_wrong_order_number(order_number)
            return

        self.source: Source = order.sources.first()
        self.momo = Momo(self.source.source_type.name, momo_number, f'Order#${order_number}')

        self.respond('REQUESTING', 'Requesting for payment. Please wait...')
        self.request_payment()

    def request_payment(self):
        self.momo.request_payment(self.source.amount_allocated)
        self.send(text_data=json.dumps({
            'status': 'WAITING',
            'message': 'Please check your phone for an authorization prompt for confirmation.'
        }))
        self.confirm_payment()

    def confirm_payment(self):
        attemtps = 0
        secs = 15

        time.sleep(secs) # wait for (secs)seconds before first request
        while not self.momo.confirm_payment():
            attemtps += 1

            if attemtps == 4:
                self.send(text_data=json.dumps({
                    'status': 'TIMEOUT',
                    'message': 'Timeout waiting for authorization.'
                }))
                self.close()
                return

            time.sleep(secs) # wait for (secs)seconds before another request

        self.source.debit(self.source.amount_allocated)
        self.send(text_data=json.dumps({
            'status': 'AUTHORIZED',
            'message': 'Payment Received. Thank you for buying from us.'
        }))
        self.close()

    def send_wrong_order_number(self, order_number):
        status = 'NOTFOUND'
        message = f'Order number ({order_number}) does not exist. Please contact customer support for assistance.'
        self.respond(status, message)
        self.close()

    def send_no_order_number(self):
        status = 'BADDATA'
        message = 'Order number not provided. You must provide an order number.'
        self.respond(status, message)
        self.close()

    def send_no_momo_number(self):
        status = 'BADDATA'
        message = 'Momo number not provided. You must provide a momo number.'
        self.respond(status, message)
        self.close()

    def respond(self, status: str, message):
        self.send(text_data=json.dumps({
            'status': status,
            'message': message
        }))