/**
 * 加载更多番剧条目
 *
 * 此函数根据传入的加载器参数，动态加载更多番剧条目
 * 它可以处理单个加载器或页面上的所有加载器
 *
 * @param {string|HTMLElement} loader - 加载器的ID或'all'以处理所有加载器
 */
async function loadMoreBgm(loader) {
    if (loader === 'all') {
        // 加载页面上的全部面板
        Array.from(document.querySelectorAll('.loader')).forEach(item => {
            loadMoreBgm(item);
        });
        return;
    }

    loader.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';

    const refSelector = loader.getAttribute('data-ref');
    if (!refSelector) {
        loader.innerHTML = '加载失败';
        return;
    }

    const listEl = document.querySelector(refSelector);
    if (!listEl) {
        loader.innerHTML = '加载失败';
        return;
    }

    let bgmCur = parseInt(listEl.getAttribute('bgmCur') || '0', 10);
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
                let status, total;
                if (!item.count) {
                    status = 100;
                    total = '未知';
                } else {
                    status = item.status / item.count * 100;
                    total = String(item.count);
                }
                let html = `
                    <a class="bgm-item" data-id="${item.id}" href="${item.url}" target="_blank">
                        <div class="bgm-item-thumb" style="background-image:url(${item.img})"></div>
                        <div class="bgm-item-info">
                            <span class="bgm-item-title main">${item.name}</span>
                            <span class="bgm-item-title">${name_cn}</span>
                            {{status-bar}}
                        </div>
                    </a>`;
                if (type === 'watching') {
                    html = html.replace('{{status-bar}}', `
                            <div class="bgm-item-statusBar-container">
                                <div class="bgm-item-statusBar" style="width:${String(status)}%"></div>
                                进度：${String(item.status)} / ${total}
                            </div>`);
                } else {
                    html = html.replace('{{status-bar}}', '');
                }
                listEl.insertAdjacentHTML('beforeend', html);

                bgmCur++;
            });

            // 记录当前数量
            listEl.setAttribute('bgmCur', String(bgmCur));
        })
        .catch(error => {
            console.error('加载更多番剧失败:', error);
            loader.innerHTML = '加载失败';
        })
}

/**
 * 加载日历数据并渲染日历
 * 该函数通过fetch API从服务器请求日历数据，然后清空日历元素并重新填充新的日历数据
 */
async function loadCalendar() {
    const calEl = document.querySelector('.bgm-calendar');
    if (!calEl) return;
    const calFilter = calEl.getAttribute('data-filter');

    const url = bgmBase + '?type=calendar&filter=' + calFilter;

    const getTodayId = () => {
        const jsDay = new Date().getDay();
        return jsDay === 0 ? 7 : jsDay;
    };

    const createBangumiItem = (item) => {
        const title = item.name_cn || item.name;

        const link = document.createElement('a');
        link.href = item.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.title = title;
        link.className = 'cal-bangumi-item';
        link.style.backgroundImage = `url('${item.img}')`;

        const fallbackImgUrl = 'https://placehold.co/400x600/cccccc/ffffff?text=Failed';
        link.onerror = () => {
            link.style.backgroundImage = `url('${fallbackImgUrl}')`;
        };

        const titleOverlay = document.createElement('span');
        titleOverlay.className = 'cal-bangumi-title-overlay';
        titleOverlay.textContent = title;

        link.appendChild(titleOverlay);
        return link;
    };

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
        .catch(error => {
            console.error('加载日历失败:', error);
            calEl.innerHTML = '<p class="error">加载日历失败，请刷新页面。</p>';
        })
}

/**
 * 加载番剧卡片信息
 *
 * 此函数负责遍历页面上所有类名为 'bgm-card' 的元素，并尝试加载它们的番剧信息
 * 它通过元素上的 'data-id' 属性来识别每个元素关联的番剧ID，并据此渲染或更新元素的内容
 */
async function loadBgmCard() {
    const cards = document.querySelectorAll('.bgm-card');

    cards.forEach(card => {
        const id = card.getAttribute('data-id');
        if (id) renderCard(id, card);
    })
}

/**
 * 根据番剧ID渲染番剧卡片
 * 本函数通过Bangumi API加载番剧数据，并在页面上渲染番剧卡片
 * 如果加载失败，会显示错误信息
 *
 * @param {number} subjectId 番剧ID，用于从API获取番剧信息
 * @param {HTMLElement} cardElement 番剧卡片的HTML元素，用于显示加载状态、番剧信息或错误信息
 */
async function renderCard(subjectId, cardElement) {
    cardElement.innerHTML = `<div class="loading-state">正在从 Bangumi 加载数据...</div>`;
    const url = 'https://api.bgm.tv/v0/subjects/' + subjectId;

    await fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.id === parseInt(subjectId)) {
                cardElement.innerHTML = buildCardHTML(data, subjectId);
            } else {
                throw new Error('返回的番剧数据无效');
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            cardElement.innerHTML = `<div class="error-state">无法加载番剧信息。请检查条目ID (${subjectId}) 或网络连接。</div>`;
        });
}

/**
 * 从 infobox 数组中查找特定键的值
 * @param {Array} infobox
 * @param {string} key
 * @returns {string}
 */
function findInfo(infobox, key) {
    if (!infobox) return '未知';
    const info = infobox.find(item => item && item.key === key);
    return (info && info.value) || '未知';
}

/**
 * 构建卡片HTML
 * @param {object} data
 * @param {string} subjectId
 * @returns {string}
 */
function buildCardHTML(data, subjectId) {
    const nameCN = data.name_cn || data.name;
    const nameOriginal = data.name_cn ? data.name : '';

    const posterUrl = (data.images && data.images.large) || '';
    const summary = (data.summary || '暂无简介。').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const bangumiUrl = `https://bgm.tv/subject/${subjectId}`;

    const rating = data.rating || {};
    const score = rating.score || 'N/A';
    const rank = rating.rank ? `#${rating.rank}` : 'N/A';

    const releaseDate = data.date || '未知';
    const broadcastDay = findInfo(data.infobox, '放送星期');

    let totalEpisodes = findInfo(data.infobox, '话数');
    if (totalEpisodes === '未知' && data.total_episodes > 0) {
        totalEpisodes = data.total_episodes;
    }

    return `
    <a href="${bangumiUrl}" target="_blank" rel="noopener noreferrer">
      <div class="bgm-card-poster">
        <img src="${posterUrl}" alt="${nameCN} Poster" loading="lazy">
      </div>
      <div class="bgm-card-content">
        <div class="bgm-card-header">
          <h3 class="title" title="${nameCN}">${nameCN}</h3>
          ${nameOriginal ? `<p class="original-title" title="${nameOriginal}">${nameOriginal}</p>` : ''}
        </div>
        <div class="bgm-card-meta">
          <div class="meta-item" title="评分">
            <i class="meta-icon icon-star"></i>
            <span>评分: <span class="score">${score}</span></span>
          </div>
          <div class="meta-item" title="排名">
            <i class="meta-icon icon-trophy"></i>
            <span>排名: <span class="rank">${rank}</span></span>
          </div>
          <div class="meta-item" title="首播日期">
            <i class="meta-icon icon-calendar"></i>
            <span>${releaseDate}</span>
          </div>
          <div class="meta-item" title="放送星期">
            <i class="meta-icon icon-tv"></i>
            <span>${broadcastDay}</span>
          </div>
          <div class="meta-item" title="总集数">
            <i class="meta-icon icon-list"></i>
            <span>全 ${totalEpisodes} 话</span>
          </div>
        </div>
        <p class="bgm-card-summary">${summary.replace(/\r\n/g, "<br>")}</p>
      </div>
    </a>
  `;
}

/**
 * 初始化所有番剧列表
 *
 * 本函数主要用于初始化番剧列表，并顺带初始化日历和番剧卡片
 */
async function initCollection() {
    let bgmIndex = 0;
    Array.from(document.querySelectorAll('.bgm-collection')).forEach(item => {
        bgmIndex++;
        item.setAttribute('id', 'bgm-collection-' + String(bgmIndex));
        item.insertAdjacentHTML('afterend', '<div class="loader" data-ref="' + '#bgm-collection-' + String(bgmIndex) + '" onclick="loadMoreBgm(this);"></div>');
    });

    await loadMoreBgm('all');

    await loadCalendar();

    await loadBgmCard();
}

document.addEventListener('DOMContentLoaded', async () => initCollection())

document.addEventListener('pjax:complete', async () => initCollection())