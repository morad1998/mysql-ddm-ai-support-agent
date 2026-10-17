// Front end for the DDM support agent demo. Served by the API on the same origin.
// All values are inserted with textContent, never as HTML.

const API = '';

function setStatus(el, text, isError = false) {
  el.textContent = text;
  el.classList.toggle('error', isError);
}

function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

// One-line summary of a tool's outputs, for the trace list.
function summarize(outputs) {
  if (!Array.isArray(outputs) || outputs.length === 0) return 'no rows';
  const first = outputs[0];
  if (first.error) return `error: ${first.error}`;
  if (first.result) return String(first.result);
  return `${outputs.length} row${outputs.length === 1 ? '' : 's'}: ${JSON.stringify(first).slice(0, 140)}`;
}

// ---------------------------------------------------------------------------
// Agent chat
// ---------------------------------------------------------------------------

const askForm = document.getElementById('ask-form');
const askButton = document.getElementById('ask-button');
const askStatus = document.getElementById('ask-status');
const traceList = document.getElementById('tool-trace');
const finalAnswer = document.getElementById('final-answer');

askForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const code = document.getElementById('ask-code').value.trim();
  const question = document.getElementById('ask-question').value.trim();

  askButton.disabled = true;
  setStatus(askStatus, 'The agent is investigating… this takes a few seconds.');
  clear(traceList);
  traceList.appendChild(element('li', 'empty', 'Waiting for the agent…'));
  finalAnswer.textContent = '';

  try {
    const res = await fetch(`${API}/demo/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, question }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    clear(traceList);
    if (data.toolTrace.length === 0) traceList.appendChild(element('li', 'empty', 'The agent called no tools.'));
    for (const step of data.toolTrace) {
      const li = element('li');
      li.appendChild(element('span', 'tool', step.tool));
      li.appendChild(element('span', 'args', ` ${JSON.stringify(step.parameters)}`));
      li.appendChild(element('div', 'summary', summarize(step.outputs)));
      traceList.appendChild(li);
    }

    finalAnswer.classList.remove('empty');
    finalAnswer.textContent = data.finalAnswer || '(no answer)';
    const cap = data.capHit ? ' Tool-call limit reached.' : '';
    setStatus(askStatus, `Done: ${data.toolTrace.length} tool call(s), ${data.modelCalls} model call(s).${cap}`);
  } catch (err) {
    clear(traceList);
    traceList.appendChild(element('li', 'empty', 'No trace.'));
    finalAnswer.classList.add('empty');
    finalAnswer.textContent = 'No answer.';
    setStatus(askStatus, `Request failed: ${err.message}`, true);
  } finally {
    askButton.disabled = false;
  }
});

// ---------------------------------------------------------------------------
// Masked vs. real comparison
// ---------------------------------------------------------------------------

const compareForm = document.getElementById('compare-form');
const compareStatus = document.getElementById('compare-status');
const maskedView = document.getElementById('masked-view');
const realView = document.getElementById('real-view');

function renderView(dl, row) {
  clear(dl);
  for (const [key, value] of Object.entries(row)) {
    dl.appendChild(element('dt', null, key));
    dl.appendChild(element('dd', null, String(value)));
  }
}

async function compare(code) {
  setStatus(compareStatus, 'Loading…');
  try {
    const res = await fetch(`${API}/demo/compare/${encodeURIComponent(code)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    renderView(maskedView, data.masked);
    renderView(realView, data.real);
    setStatus(compareStatus, '');
  } catch (err) {
    clear(maskedView);
    clear(realView);
    setStatus(compareStatus, `Request failed: ${err.message}`, true);
  }
}

compareForm.addEventListener('submit', (event) => {
  event.preventDefault();
  compare(document.getElementById('compare-code').value.trim());
});

compare(document.getElementById('compare-code').value.trim());
