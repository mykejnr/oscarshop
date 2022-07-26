import asyncio
import random

class Momo:
    def __init__(self, payment_method: str, momo_number: int, reference: str):
        self.payment_method = payment_method
        self.momo_number = momo_number
        self.reference = reference

    async def request_payment(self, amount: int) -> bool:
        # naive implementation
        # TODO implement momo/voda cash
        await asyncio.sleep(2)
        return True

    async def confirm_payment(self) -> bool:
        # naive implementation
        # TODO implement momo/voda cash
        await asyncio.sleep(2)
        if random.randint(0, 3) == 1:
            return True
        return False