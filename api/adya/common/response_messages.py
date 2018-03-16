class ResponseMessage():
    def __init__(self, response_code, response_message):
        self.response_code = response_code
        self.response_message = response_message
    def get_response_body(self):
        return {"message" : self.response_message}