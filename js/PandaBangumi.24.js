console.log('%c PandaBangumi 2.3 %c https://blog.imalan.cn/archives/128/ ', 'color: #fadfa3; background: #23b7e5; padding:5px 0;', 'background: #1c2b36; padding:5px 0;');

function loadMoreBgm(loader) {
    if (loader === 'all') {
        // 加载页面上的全部面板
        Array.from(document.querySelectorAll('.loader')).forEach(item => {
            loadMoreBgm(item);
        });
        return;
    }

    loader.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';

    // 拼接 URL
    const listEl = document.querySelector(loader.getAttribute('data-ref'));
    let bgmCur = listEl.getAttribute('bgmCur');
    bgmCur = typeof bgmCur === 'string' ? parseInt(bgmCur) : 0;
    const type = listEl.getAttribute('data-type');
    const cate = listEl.getAttribute('data-cate');

    const url = bgmBase + '?from=' + String(bgmCur) + '&type=' + type + '&cate=' + cate;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            loader.innerHTML = '加载更多';
            if (data.length < 1) loader.innerHTML = '没有了';

            data.forEach(item => {
                const name_cn = item.name_cn ? item.name_cn : item.name;
                let status;
                let total;
                if (!item.count) {
                    status = 100;
                    total = '未知';
                }
                else {
                    status = item.status / item.count * 100;
                    total = String(item.count);
                }
                let html = `<a class="bgm-item" data-id="` + item.id + `" href="` + item.url + `" target="_blank">
                        <div class="bgm-item-thumb" style="background-image:url(`+ item.img + `)"></div>
                        <div class="bgm-item-info">
                            <span class="bgm-item-title main">`+ item.name + `</span>
                            <span class="bgm-item-title">`+ name_cn + `</span>
                            {{status-bar}}
                        </div>
                    </a>`;
                if (type === 'watching') {
                    html = html.replace('{{status-bar}}', `
                            <div class="bgm-item-statusBar-container">
                                <div class="bgm-item-statusBar" style="width:`+ String(status) + `%"></div>
                                进度：`+ String(item.status) + ` / ` + total + `
                            </div>`);
                } else {
                    html = html.replace('{{status-bar}}', '');
                }
                listEl.insertAdjacentHTML('beforeend', html);

                bgmCur++;
            })

            // 记录当前数量
            listEl.setAttribute('bgmCur', String(bgmCur));
        })
}

function initCollection() {
    let bgmIndex = 0;
    Array.from(document.querySelectorAll('.bgm-collection')).forEach(item => {
        bgmIndex++;
        item.setAttribute('id', 'bgm-collection-' + String(bgmIndex));
        item.insertAdjacentHTML('afterend', '<div class="loader" data-ref="' + '#bgm-collection-' + String(bgmIndex) + '" onclick="loadMoreBgm(this);"></div>');
    });

    loadMoreBgm('all');
}

document.addEventListener('DOMContentLoaded', function () {
    initCollection();
})

document.addEventListener('pjax:complete', function () {
    initCollection();
})