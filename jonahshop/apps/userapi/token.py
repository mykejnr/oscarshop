from apps.core.token import TokenGenerator


class ChangeEmailTokenGenerator(TokenGenerator):
    def __init__(self, new_email):
        self.new_email = new_email
        super().__init__()

    def make_hash_value(self, user, timestamp):
        return f'{super().make_hash_value(user, timestamp)}{self.new_email}'
