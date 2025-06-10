async function loadMoreBgm(loader) {
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
    await fetch(url)
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

async function loadCalendar() {
    const calEl = document.querySelector('.bgm-calendar');
    const calFilter = calEl.getAttribute('data-filter');

    const url = bgmBase + '?type=calendar&filter=' + calFilter;

    const getTodayId = () => {
        const jsDay = new Date().getDay();
        return jsDay === 0 ? 7 : jsDay;
    }

    const createBangumiItem  = (item) => {
        const title = item.name_cn || item.name;

        const link = document.createElement('a');
        link.href = item.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.title = title;
        link.className = 'cal-bangumi-item';
        link.style.backgroundImage = `url('${item.img}')`;
        link.setAttribute('onerror', "this.style.backgroundImage='url(https://placehold.co/400x600/cccccc/ffffff?text=加载失败)'");

        const titleOverlay = document.createElement('span');
        titleOverlay.className = 'cal-bangumi-title-overlay';
        titleOverlay.textContent = title;

        link.appendChild(titleOverlay);
        return link;
    }


    await fetch(url)
        .then(response => response.json())
        .then(data => {
            const todayId = getTodayId();
            calEl.innerHTML = '';

            data.forEach(day => {
                const dayRow = document.createElement('div');
                dayRow.className = 'cal-day-row';
                if (day.id === todayId) {
                    dayRow.classList.add('cal-today-highlight');
                }

                const header = document.createElement('div');
                header.className = 'cal-day-row-header';
                header.innerHTML = `<h3>${day.date_cn}</h3>`;

                const itemsWrapper = document.createElement('div');
                itemsWrapper.className = 'cal-items-container';

                const itemsArray = day.items ? Object.values(day.items) : [];

                if (itemsArray.length > 0) {
                    itemsArray.forEach(item => {
                        itemsWrapper.appendChild(createBangumiItem(item));
                    });
                } else {
                    itemsWrapper.innerHTML = `<p style="color:#a0aec0; font-size: 0.875rem;">今日无更新</p>`;
                }

                dayRow.appendChild(header);
                dayRow.appendChild(itemsWrapper);
                calEl.appendChild(dayRow);
            });
        })
}

async function initCollection() {
    let bgmIndex = 0;
    Array.from(document.querySelectorAll('.bgm-collection')).forEach(item => {
        bgmIndex++;
        item.setAttribute('id', 'bgm-collection-' + String(bgmIndex));
        item.insertAdjacentHTML('afterend', '<div class="loader" data-ref="' + '#bgm-collection-' + String(bgmIndex) + '" onclick="loadMoreBgm(this);"></div>');
    });

    await loadMoreBgm('all');

    await loadCalendar();
}

document.addEventListener('DOMContentLoaded', async () => initCollection())

document.addEventListener('pjax:complete', async () => initCollection())