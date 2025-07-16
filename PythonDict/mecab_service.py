from fastapi import FastAPI, Request
from pydantic import BaseModel
import MeCab

app = FastAPI()
tagger = MeCab.Tagger()


class TextInput(BaseModel):
    text: str


@app.post("/parse")
def parse_text(input: TextInput):
    result = tagger.parse(input.text)
    return {"parsed": result}
