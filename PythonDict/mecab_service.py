from fastapi import FastAPI
from pydantic import BaseModel
import MeCab

app = FastAPI()
tagger = MeCab.Tagger()


class TextInput(BaseModel):
    text: str


@app.post("/parse")
def parse_text(input: TextInput):
    node = tagger.parseToNode(input.text)
    results = []
    while node:
        if node.surface:
            features = node.feature.split(",")
            # MeCab ipadic returns up to 9 fields; pad with "*" if fewer
            features += ["*"] * (9 - len(features))
            results.append({
                "surface": node.surface,
                "features": {
                    "partOfSpeech": features[0],
                    "subClass1": features[1],
                    "subClass2": features[2],
                    "subClass3": features[3],
                    "inflection": features[4],
                    "conjugation": features[5],
                    "rootForm": features[6],
                    "reading": features[7],
                    "pronunciation": features[8],
                }
            })
        node = node.next
    return {"parsed": results}