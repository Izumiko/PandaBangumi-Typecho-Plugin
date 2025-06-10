<?php

namespace TypechoPlugin\PandaBangumi;

use Widget\ActionInterface;
use Widget\Base\Contents;

use Utils\Helper;

/**
 * Action.php
 *
 * API 获取、更新数据，处理前端 AJAX 请求
 *
 * @author 熊猫小A
 */
if (!defined('__TYPECHO_ROOT_DIR__')) {
    exit;
}

class Action extends Contents implements ActionInterface
{
    /**
     * 返回请求的 HTML
     * @access public
     */
    public function action(): void
    {
        header("Content-type: application/json");
        if (!array_key_exists('type', $_GET)) {
            echo json_encode(array());
            exit;
        }

        $options = Helper::options();
        $ID = $options->plugin('PandaBangumi')->ID;
        $PageSize = $options->plugin('PandaBangumi')->PageSize;
        $ValidTimeSpan = $options->plugin('PandaBangumi')->ValidTimeSpan;
        $From = array_key_exists('from', $_GET) ? $_GET['from'] : 0;
        if ($PageSize == -1) {
            $PageSize = 1000000;
        }

        if (strtolower($_GET['type']) == 'watching')
            echo BangumiAPI::updateWatchingCacheAndReturn($ID, $PageSize, $From, $ValidTimeSpan);
        elseif (strtolower($_GET['type']) == 'watched')
            echo BangumiAPI::updateWatchedCacheAndReturn($ID, $PageSize, $From, $ValidTimeSpan);
        elseif (strtolower($_GET['type']) == 'calendar')
            echo BangumiAPI::updateCalendarCacheAndReturn($ID, $ValidTimeSpan);
    }
}
