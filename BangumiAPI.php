<?php

namespace TypechoPlugin\PandaBangumi;

use Typecho\Plugin\Exception;
use Utils\Helper;

class BangumiAPI
{
    /**
     * 使用 curl 代替 file_get_contents()
     *
     * @access public
     * @param string $_url
     * @return bool|string
     */
    public static function curlFileGetContents(string $_url): bool|string
    {
        $myCurl = curl_init($_url);
        //不验证证书
        curl_setopt($myCurl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($myCurl, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($myCurl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($myCurl, CURLOPT_HEADER, false);
        curl_setopt($myCurl, CURLOPT_REFERER, 'https://bgm.tv/');
        curl_setopt($myCurl, CURLOPT_USERAGENT, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36');
        $content = curl_exec($myCurl);
        //关闭
        curl_close($myCurl);
        return $content;
    }

    /**
     * 获取收藏数据并格式化返回
     *
     * @param string $ID
     * @param int $Offset
     * @param int $status 1:想看 2:看过 3:在看 4:搁置 5:抛弃
     * @param int $subject_type 1:book 2:anime 3:music 4:game 6:real
     * @return array
     * @throws Exception
     */
    private static function __getCollectionRawData(string $ID, int $Offset = 0, int $status = 3, int $subject_type = 2): array
    {
        $apiUrl = 'https://api.bgm.tv/v0/users/' . $ID . '/collections?subject_type=' . $subject_type . '&type=' . $status . '&limit=30&offset=' . $Offset;
        $json = self::curlFileGetContents($apiUrl);
        if ($json == 'null') {
            return array(); // 没有标记数据
        }

        $data = json_decode($json, true);

        $collections = array();

        $total = $data['total'];
        $limit = $data['limit'];
        $offset = $data['offset'];
        $list = $data['data'];

        foreach ($list as $item) {
            $collect = array(
                'name' => $item['subject']['name'],
                'name_cn' => $item['subject']['name_cn'],
                'url' => 'https://bgm.tv/subject/' . $item['subject']['id'],
                'status' => $item['ep_status'],
                'count' => $item['subject']['eps'],
                'air_date' => $item['subject']['date'],
                'img' => $item['subject']['images']['small'],
                'id' => $item['subject']['id'],
            );
            $collections[] = $collect;
        }

        $userLimit = Helper::options()->plugin('PandaBangumi')->Limit;

        if ($total > $limit + $offset && $userLimit > $limit + $offset) {
            $collections = array_merge($collections, self::__getCollectionRawData($ID, $limit + $offset, $status, $subject_type));
        }

        return $collections;
    }

    /**
     * 获取日历数据并格式化返回
     *
     * @return array
     * @throws Exception
     */
    private static function __getCalendarRawData(): array
    {
        $apiUrl = 'https://api.bgm.tv/calendar';
        $json = self::curlFileGetContents($apiUrl);

        if ($json == 'null') {
            return array();
        }

        $data = json_decode($json, true);

        $calendar = array();

        foreach ($data as $day) {
            $items = array_map(function ($item) {
                return [
                    'id' => $item['id'],
                    'name' => $item['name'],
                    'name_cn' => $item['name_cn'],
                    'url' => $item['url'],
                    'img' => $item['images']['grid']
                ];
            }, $day['items']);
            $calendar[] = array(
                'id' => $day['weekday']['id'],
                'date_en' => $day['weekday']['en'],
                'date_cn' => $day['weekday']['cn'],
                'items' => $items
            );
        }

        return $calendar;
    }

    /**
     * 检查缓存是否过期
     *
     * @access  private
     * @param string $FilePath 缓存路径
     * @param int $ValidTimeSpan 有效时间，Unix 时间戳，s
     * @return  mixed     正常数据: 未过期; 1:已过期; -1：无缓存或缓存无效
     */
    private static function __isCacheExpired(string $FilePath, int $ValidTimeSpan): mixed
    {
        if (!file_exists($FilePath)) {
            return -1;
        }

        $content = json_decode(file_get_contents($FilePath), true);
        if (!array_key_exists('time', $content) || $content['time'] < 1) {
            return -1;
        }

        if (time() - $content['time'] > $ValidTimeSpan) {
            return 1;
        }

        return $content;
    }


    /**
     * 读取与更新本地已看缓存，格式化返回已看数据
     *
     * @access public
     * @param string $ID
     * @param int $PageSize
     * @param int $From
     * @param int $ValidTimeSpan
     * @return string
     * @throws Exception
     */
    public static function updateWatchedCacheAndReturn(string $ID, int $PageSize, int $From, int $ValidTimeSpan): string
    {
        $cache = self::__isCacheExpired(__DIR__ . '/json/watched.json', $ValidTimeSpan);

        // 缓存过期或缓存无效
        if ($cache == -1 || $cache == 1) {
            // 缓存无效，重新请求，数据写入
            $watchedAnime = self::__getCollectionRawData($ID, 0, 2);
            $watchedReal = self::__getCollectionRawData($ID, 0, 2, 6);

            $cache = array('time' => time(), 'data' => array(
                'anime' => $watchedAnime,
                'real' => $watchedReal)
            );
            // 若全空，很可能是请求失败，则下次强制刷新
            if (!count($watchedAnime) && !count($watchedReal)) {
                $cache['time'] = 1;
            }

            file_put_contents(__DIR__ . '/json/watched.json', json_encode($cache));
        }

        $cate = array_key_exists('cate', $_GET) ? $_GET['cate'] : 'anime';
        $cate = $cate == 'null' ? 'anime' : $cate;
        if (!array_key_exists($cate, $cache['data']))
            return json_encode(array());

        $data = $cache['data'][$cate];
        $total = count($data);

        if ($From < 0 || $From > $total) {
            echo json_encode(array());
        } else {
            $end = min($From + $PageSize, $total);
            $out = array();
            for ($index = $From; $index < $end; $index++) {
                $out[] = $data[$index];
            }
            return json_encode($out);
        }

        return json_encode(array());
    }

    /**
     * 读取与更新本地缓存，格式化返回数据
     *
     * @access public
     * @param string $ID
     * @param int $PageSize
     * @param int $From
     * @param int $ValidTimeSpan
     * @return string
     * @throws Exception
     */
    public static function updateWatchingCacheAndReturn(string $ID, int $PageSize, int $From, int $ValidTimeSpan): string
    {
        $cache = self::__isCacheExpired(__DIR__ . '/json/watching.json', $ValidTimeSpan);

        if ($cache == -1 || $cache == 1) {
            // 缓存无效，重新请求，数据写入
            $watchingAnime = self::__getCollectionRawData($ID);
            $watchingReal = self::__getCollectionRawData($ID, 0, 3, 6);
            if (!count($watchingAnime) && !count($watchingReal)) {
                // 请求数据为空
                $cache = array('time' => 1, 'data' => array());
            } else {
                $cache = array('time' => time(), 'data' => array(
                    'anime' => $watchingAnime,
                    'real' => $watchingReal
                ));
            }
            file_put_contents(__DIR__ . '/json/watching.json', json_encode($cache));
        }

        $cate = array_key_exists('cate', $_GET) ? $_GET['cate'] : 'anime';
        $cate = $cate == 'null' ? 'anime' : $cate;
        if (!array_key_exists($cate, $cache['data']))
            return json_encode(array());

        $data = $cache['data'][$cate];
        $total = count($data);

        if ($From < 0 || $From > $total) {
            echo json_encode(array());
        } else {
            $end = min($From + $PageSize, $total);
            $out = array();
            for ($index = $From; $index < $end; $index++) {
                $out[] = $data[$index];
            }
            return json_encode($out);
        }

        return json_encode(array());
    }

    /**
     * 读取与更新本地日历缓存，格式化返回日历数据
     *
     * @access public
     * @param string $ID
     * @param int $ValidTimeSpan
     * @return string
     * @throws Exception
     */
    public static function updateCalendarCacheAndReturn(string $ID, int $ValidTimeSpan): string
    {
        $cache = self::__isCacheExpired(__DIR__ . '/json/calendar.json', $ValidTimeSpan);

        if ($cache == -1 || $cache == 1) {
            // 缓存无效，重新请求，数据写入
            $raw = self::__getCalendarRawData();
            if ($raw == -1 || count($raw) == 0) {
                // 请求数据为空
                $cache = array('time' => 1, 'data' => array());
            } else {
                $cache = array('time' => time(), 'data' => $raw);
            }
            file_put_contents(__DIR__ . '/json/calendar.json', json_encode($cache));
        }

        $filter = array_key_exists('filter', $_GET) ? $_GET['filter'] : 'watching';
        if ($filter != 'watching') {
            return json_encode($cache['data']);
        }

        $watchingAnimes = json_decode(self::updateWatchingCacheAndReturn($ID, 1000, 0, $ValidTimeSpan), true);
        $watchingAnimeIds = array_column($watchingAnimes, 'id');

        $cal = array();
        foreach ($cache['data'] as $day) {
            $items = array_filter($day['items'], function ($item) use ($watchingAnimeIds) {
                return in_array($item['id'], $watchingAnimeIds);
            });
            $cal[] = array(
                'id' => $day['id'],
                'date_en' => $day['date_en'],
                'date_cn' => $day['date_cn'],
                'items' => $items
            );
        }
        return json_encode($cal);
    }
}
