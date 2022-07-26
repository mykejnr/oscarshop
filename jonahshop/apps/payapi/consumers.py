import asyncio

from oscar.core.loading import get_model
from oscar.apps.payment.models import Source
from oscar.apps.order.models import Order as OsOrder

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

from rest_framework import status

from apps.payapi.momo import Momo


Order: OsOrder = get_model('order', 'Order')


class PaymentConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def receive_json(self, content, **kwargs):
        try:
            momo_number = content['momo_number']
            self.order_number = content['order_number']
        except KeyError:
            # TODO Log error
            # This error should'nt happen because we expect our client
            # To supply both order number and momo number. Howerver we
            # handle and log the incident (for further investigation)
            await self.close(4007)
            print(content, '4007')
            return
        try:
            self.order : Order= await database_sync_to_async(self.get_order)()
        except Order.DoesNotExist:
            # TODO Log error
            # This shouldn't happen either
            # our client is supposed to send an order number that it
            # earlier received from this server
            await self.close(4004)
            print(content, '4004')
        else:
            self.source: Source = await database_sync_to_async(self.get_source)()
            source_type = await database_sync_to_async(self.get_source_type)()
            self.momo = Momo(source_type, momo_number, f'Order#${self.order_number}')

            await self.respond(102, 'Requesting for payment. Please wait...', 'REQUESTING')
            await self.request_payment()

    async def request_payment(self):
        await self.momo.request_payment(self.source.amount_allocated)
        msg = 'Please check your phone for an authorization prompt for confirmation.'
        await self.respond(102, msg, 'WAITING')
        await self.confirm_payment()

    async def confirm_payment(self):
        attemtps = 0
        secs = 10

        await asyncio.sleep(secs) # wait for (secs)seconds before first request
        while not await self.momo.confirm_payment():
            attemtps += 1

            if attemtps == 4:
                await self.close(4008)
                return

            await asyncio.sleep(secs) # wait for (secs)seconds before another request

        await database_sync_to_async(self.debit)()

        msg = 'Payment Received. Thank you for buying from us.'
        await self.respond(status.HTTP_200_OK, msg, 'AUTHORIZED')
        await self.close(1000)

    async def respond(self, status: int, message: str, status_text: str = ''):
        await self.send_json({
            'status': status,
            'status_text': status_text,
            'message': message
        })

    def get_order(self) -> Order:
        return Order.objects.get(number=self.order_number)

    def get_source(self) -> Source:
        return self.order.sources.first()

    def get_source_type(self) -> any:
        return self.source.source_type

    def debit(self) -> None:
        self.source.debit(self.source.amount_allocated)