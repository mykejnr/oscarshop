from celery import shared_task


# @shared_task
def send_reset_email(uid64, token):
    print(uid64, token)