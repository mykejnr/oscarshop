from datetime import datetime

from django.conf import settings
from django.utils.crypto import constant_time_compare, salted_hmac
from django.utils.http import base36_to_int, int_to_base36


class TokenGenerator:
    """
    We copy the implementation of django's PasswordResetTokenGenerator. We do this 
    purposely to exclude user's last login from the hash that is 
    used to generate to token. We do not want the token to be invalidated
    on user's last login.

    As this is to be used for other things but password reset
    """
    def __init__(self):
        self.secret = settings.SECRET_KEY
        self.algorithm = 'sha256'
        self.key_salt = "django.contrib.auth.tokens.PasswordResetTokenGenerator"

    def make_token(self, user):
        """
        Return a token that can be used once to do a password reset
        for the given user.
        """
        return self.make_token_with_timestamp(user, self._num_seconds(self._now()))

    def check_token(self, user, token):
        """
        Check that the token is correct for a given user.
        """
        if not (user and token):
            return False
        # Parse the token
        try:
            ts_b36, _ = token.split("-")
        except ValueError:
            return False

        try:
            ts = base36_to_int(ts_b36)
        except ValueError:
            return False

        # Check that the timestamp/uid has not been tampered with
        if not constant_time_compare(self.make_token_with_timestamp(user, ts), token):
            return False

        now = self._now()
        if (self._num_seconds(now) - ts) > settings.PASSWORD_RESET_TIMEOUT:
            return False

        return True

    def make_token_with_timestamp(self, user, timestamp):
        # timestamp is number of seconds since 2001-1-1. Converted to base 36,
        # this gives us a 6 digit string until about 2069.
        ts_b36 = int_to_base36(timestamp)
        hash_value = self.make_hash_value(user, timestamp)

        hash_string = salted_hmac(
            self.key_salt,
            hash_value,
            secret=self.secret,
            algorithm=self.algorithm,
        ).hexdigest()[::2]  # Limit to shorten the URL.

        return "%s-%s" % (ts_b36, hash_string)

    def make_hash_value(self, user, timestamp):
        # Truncate microseconds so that tokens are consistent even if the
        # database doesn't support microseconds.
        email_field = user.get_email_field_name()
        email = getattr(user, email_field, '') or ''
        return f'{user.pk}{user.password}{timestamp}{email}'

    def _num_seconds(self, dt):
        return int((dt - datetime(2001, 1, 1)).total_seconds())

    def _now(self):
        # Used for mocking in tests
        return datetime.now()