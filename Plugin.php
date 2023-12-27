<?php

namespace TypechoPlugin\PandaBangumi;

use Typecho\Plugin\PluginInterface;
use Typecho\Plugin\Exception as PluginException;
use Typecho\Widget\Helper\Form;
use Typecho\Widget\Helper\Form\Element\Radio;
use Typecho\Widget\Helper\Form\Element\Checkbox;
use Typecho\Widget\Helper\Form\Element\Text;
use Widget\Options;
use Utils\Helper;

if (!defined('__TYPECHO_ROOT_DIR__')) {
    exit;
}

/**
 * 给博客添加精美的番剧展示页吧！
 *
 *
 * @package PandaBangumi
 * @author 熊猫小A
 * @version 2.4
 * @link https://www.imalan.cn
 */

define('PandaBangumi_Plugin_VERSION', '2.3');

class Plugin implements PluginInterface
{
    /**
     * 激活插件方法,如果激活失败,直接抛出异常
     *
     * @access public
     * @return void
     * @throws PluginException
     */
    public static function activate(): void
    {
        // 检查是否存在对应扩展
        if (!extension_loaded('openssl')) {
            throw new PluginException('启用失败，PHP 需启用 OpenSSL 扩展。');
        }
        if (!extension_loaded('curl')) {
            throw new PluginException('启用失败，PHP 需启用 CURL 扩展。');
        }

        \Typecho\Plugin::factory('Widget_Archive')->header = __CLASS__ . '::header';
        \Typecho\Plugin::factory('Widget_Archive')->footer = __CLASS__ . '::footer';
        Helper::addRoute("route_PandaBangumi", "/PandaBangumi", "PandaBangumi_Action", 'action');
    }

    /**
     * 禁用插件方法,如果禁用失败,直接抛出异常
     *
     * @static
     * @access public
     * @return void
     */
    public static function deactivate(): void
    {
        Helper::removeRoute("route_PandaBangumi");
    }

    /**
     * 获取插件配置面板
     *
     * @access public
     * @param Form $form 配置面板
     * @return void
     */
    public static function config(Form $form): void
    {
        echo '作者：<a href="https://www.imalan.cn">熊猫小A</a>，插件介绍页：<a href="https://blog.imalan.cn/archives/128/">熊猫追番 (PandaBangumi) for Typecho</a><br>';
        echo '<br><strong>使用方法，在文章要插入的地方写：</strong><br>';
        echo htmlspecialchars('所有在看：<div data-type="watching" class="bgm-collection"></div>');
        echo '<br>';
        echo htmlspecialchars('已看动画：<div data-type="watched" data-cate="anime" class="bgm-collection"></div>');
        echo '<br>';
        echo htmlspecialchars('已看三次元：<div data-type="watched" data-cate="real" class="bgm-collection"></div>');
        echo '<br>';

        $ID = new Text('ID', NULL, '', _t('用户 ID'), _t('填写你的 Bangumi 主页链接 user 后面那一串数字'));
        $form->addInput($ID);

        $PageSize = new Text('PageSize', NULL, '6', _t('每页数量'), _t('填写番剧列表每页数量，填写 -1 则在一页内全部显示，默认为 6.'));
        $form->addInput($PageSize);

        $ValidTimeSpan = new Text('ValidTimeSpan', NULL, '86400', _t('缓存过期时间'), _t('设置缓存过期时间，单位为秒，默认 24 小时。'));
        $form->addInput($ValidTimeSpan);

        $Limit = new Text('Limit', NULL, '30', _t('已看列表数量限制'), _t('设置获取数量限制，不建议设置得太大，有被 Bangumi 拉黑的风险。'));
        $form->addInput($Limit);
    }

    /**
     * 个人用户的配置面板
     *
     * @access public
     * @param Form $form
     * @return void
     */
    public static function personalConfig(Form $form)
    {
    }

    /**
     * 输出头部css
     *
     * @access public
     * @return void
     * @throws PluginException
     */
    public static function header(): void
    {
        $config = Options::alloc()->plugin('PandaBangumi');


        echo '<link rel="stylesheet" href="';
        Options::alloc()->pluginUrl('/PandaBangumi/css/PandaBangumi.25.css');
        echo '?v=' . PandaBangumi_Plugin_VERSION . '" />';
        echo '<script>const bgmBase="';
        Options::alloc()->index('/PandaBangumi');
        echo '"</script>';
    }

    /**
     * 在底部输出所需 JS
     *
     * @access public
     * @return void
     */
    public static function footer(): void
    {
        echo '<script type="text/javascript" src="';
        Options::alloc()->pluginUrl('/PandaBangumi/js/PandaBangumi.24.js');
        echo '?v=' . PandaBangumi_Plugin_VERSION . '"></script>';
    }
}
