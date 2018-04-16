import logging

import sys


class ResponseMessage():
    def __init__(self, response_code, response_message, response_body=None):
        self.response_code = response_code
        if response_body:
            self.response_body = response_body
        else:
            self.response_body = {"message": response_message}

    def get_response_code(self):
        return self.response_code

    def get_response_body(self):
        return self.response_body


class Logger:
    class __Logger:
        _logger = None

        def __init__(self):
            self.logger = logging.getLogger()
            self.logger.addHandler(logging.StreamHandler(sys.stdout))
            self.logger.setLevel(logging.INFO)

        def info(self, message):
            self.logger.info("**Adya** " + message)

        def error(self, message):
            self.logger.error("**Adya** " + message)

        def exception(self, message):
            self.logger.exception("**Adya** " + message)

        def debug(self, message):
            self.logger.debug("**Adya** " + message)

        def warn(self, message):
            self.logger.warning("**Adya** " + message)


    instance = None

    def __init__(self):
        if not Logger.instance:
            Logger.instance = Logger.__Logger()

    def __getattr__(self, name):
        return getattr(self.instance, name)
