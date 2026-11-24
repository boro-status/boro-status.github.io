(function () {
  'use strict';

  var copyIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">' +
    '<rect x="8" y="8" width="12" height="12" rx="2"></rect>' +
    '<path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>';
  var checkIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="m5 12 5 5L20 7"></path></svg>';

  function copyTextFallback(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.select();

    var copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }

    textarea.remove();
    return copied ? Promise.resolve() : Promise.reject(new Error('Copy command failed'));
  }

  function getCodeText(pre) {
    var clone = pre.cloneNode(true);
    clone.querySelectorAll('.linenos').forEach(function (lineNumbers) {
      lineNumbers.remove();
    });
    var text = clone.innerText || clone.textContent || '';
    return text.replace(/(?:\r?\n)+$/, '');
  }

  function setButtonState(button, copied) {
    button.classList.toggle('is-copied', copied);
    button.innerHTML = copied ? checkIcon : copyIcon;
    button.setAttribute('aria-label', copied ? 'Copied to clipboard' : 'Copy code to clipboard');
    button.setAttribute('title', copied ? 'Copied!' : 'Copy to clipboard');
  }

  function addButtons() {
    document.querySelectorAll('div.highlight pre').forEach(function (pre) {
      var container = pre.closest ? pre.closest('div.highlight') : pre.parentElement;
      if (!container || container.querySelector('.boro-copybutton')) {
        return;
      }

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'boro-copybutton';
      button.innerHTML = copyIcon;
      button.setAttribute('aria-label', 'Copy code to clipboard');
      button.setAttribute('title', 'Copy to clipboard');
      button.addEventListener('click', function () {
        var text = getCodeText(pre);
        var copy = navigator.clipboard && navigator.clipboard.writeText
          ? navigator.clipboard.writeText(text).catch(function () { return copyTextFallback(text); })
          : copyTextFallback(text);

        copy.then(function () {
          setButtonState(button, true);
          window.setTimeout(function () { setButtonState(button, false); }, 1800);
        }).catch(function () {
          button.setAttribute('aria-label', 'Failed to copy code');
          button.setAttribute('title', 'Failed to copy');
        });
      });

      container.appendChild(button);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addButtons);
  } else {
    addButtons();
  }
}());