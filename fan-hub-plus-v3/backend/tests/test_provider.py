import json, pytest
from types import SimpleNamespace
from fanhub.lore import ResponsesProvider
from fanhub.core import Fault

DOC = SimpleNamespace(id='a', title='Source A', sample=True, source_label='Test fixture', body='Known facts only.')

class HTTP:
    def __init__(self, ids=('a',), status=200):
        self.ids, self.status = ids, status
        self.payload = None
    def post(self, url, **kwargs):
        self.payload = kwargs
        assert url == 'https://api.openai.com/v1/responses'
        return SimpleNamespace(status_code=self.status, json=lambda: {'status': 'completed', 'output': [{'type': 'message', 'content': [{'type': 'output_text', 'text': json.dumps({'answer': 'Grounded test answer.', 'source_ids': list(self.ids)})}]}]})


def test_provider_request_contract():
    http = HTTP()
    provider = ResponsesProvider('test-key-not-live', 'configured-model', http)
    answer, ids = provider.answer('Question?', [DOC], True, [])
    assert ids == ['a'] and answer
    assert http.payload['json']['store'] is False
    assert http.payload['json']['text']['format']['strict'] is True
    assert http.payload['allow_redirects'] is False
    assert 'tools' not in http.payload['json']

@pytest.mark.parametrize('ids,status', [(('invented',), 200), ((), 200), (('a',), 429), (('a',), 500)])
def test_provider_invalid_or_failed(ids, status):
    with pytest.raises(Fault):
        ResponsesProvider('test-key', 'configured-model', HTTP(ids, status)).answer('Question?', [DOC], True, [])


def test_requires_configuration():
    with pytest.raises(ValueError):
        ResponsesProvider('', '')
