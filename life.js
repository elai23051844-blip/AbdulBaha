(function () {
  'use strict';
  var host = document.getElementById('story-cards');
  if (!host) return;

  fetch('data/stories.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var frag = document.createDocumentFragment();
      (data.stories || []).forEach(function (s) {
        var art = document.createElement('article');
        art.className = 'life-card reveal is-in';
        art.innerHTML = '<h3></h3><p></p>';
        art.querySelector('h3').textContent = s.title;
        art.querySelector('p').textContent = s.text;
        frag.appendChild(art);
      });
      host.appendChild(frag);
    })
    .catch(function () {
      host.innerHTML = '<p class="life-more">Откройте книгу на <a href="https://writings.bahai.ru/text.php?book_id=226&language_code=ru" target="_blank" rel="noopener">writings.bahai.ru</a></p>';
    });
})();
