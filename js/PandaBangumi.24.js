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

    await fetch(url)
        .then(response => response.json())
        .then(data => {
            const header = document.createElement('div');
            header.classList.add('bgm-calendar-header');
            header.innerText = '番剧日历';
            calEl.appendChild(header);

            // 创建表格元素
            const table = document.createElement('table');
            table.classList.add('bgm-calendar-table');

            // 创建表头
            const today = new Date();
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            data.forEach(day => {
                const headerCell = document.createElement('th');
                headerCell.innerText = day.date_cn;
                if (day.id % 7 === today.getDay()) {
                    headerCell.classList.add('bgm-calendar-today');
                }
                headerRow.appendChild(headerCell);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // 创建表格主体
            const tbody = document.createElement('tbody');
            const maxItems = Math.max(...data.map(day => Object.keys(day.items).length));
            for (let i = 0; i < maxItems; i++) {
                const row = document.createElement('tr');
                data.forEach(day => {
                    const itemsCell = document.createElement('td');
                    itemsCell.classList.add('bgm-calendar-items');
                    const items = day.items;
                    if (Object.keys(items).length > i) {
                        const item = items[Object.keys(items)[i]];
                        const itemLink = document.createElement('a');
                        itemLink.href = item.url;
                        itemLink.target = '_blank';
                        const itemThumbImg = document.createElement('img');
                        itemThumbImg.src = item.img;
                        itemThumbImg.classList.add('bgm-calendar-thumb');
                        const itemTitle = document.createElement('span');
                        itemTitle.classList.add('bgm-calendar-title');
                        itemTitle.innerText = item.name_cn || item.name;
                        itemLink.appendChild(itemThumbImg);
                        itemLink.appendChild(itemTitle);
                        // itemsCell.appendChild(itemThumb);
                        itemsCell.appendChild(itemLink);
                    } else {
                        itemsCell.innerText = '';
                    }
                    row.appendChild(itemsCell);
                });
                tbody.appendChild(row);
            }
            table.appendChild(tbody);
            calEl.appendChild(table);
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