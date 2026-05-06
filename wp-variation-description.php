<?php
/**
 * Plugin Name:       WooCommerce Variation Description Display
 * Plugin URI:        https://github.com/tmdoofking/wp-change-product-info
 * Description:       為 WooCommerce 變體選項新增說明圖示與彈窗。
 * Version:           1.3.0
 * Requires at least: 5.9
 * Requires PHP:      7.4
 * Requires Plugins:  woocommerce
 * Author:            DavidBuy
 * License:           GPL-2.0+
 * Text Domain:       wp-variation-description
 */

defined( 'ABSPATH' ) || exit;

define( 'WPVD_VERSION', '1.3.0' );
define( 'WPVD_DIR', plugin_dir_path( __FILE__ ) );
define( 'WPVD_URL', plugin_dir_url( __FILE__ ) );

add_action( 'plugins_loaded', 'wpvd_init', 20 );

function wpvd_init() {
    if ( ! class_exists( 'WooCommerce' ) ) {
        add_action( 'admin_notices', 'wpvd_missing_woocommerce_notice' );
        return;
    }

    add_filter( 'woocommerce_available_variation', 'wpvd_strip_variation_description', 10, 3 );
    add_action( 'wp_enqueue_scripts', 'wpvd_enqueue_assets' );
    add_action( 'wp_footer', 'wpvd_render_modal_html' );
}

function wpvd_missing_woocommerce_notice() {
    echo '<div class="notice notice-error"><p>'
        . esc_html__( '「WooCommerce 變體說明顯示」外掛需要 WooCommerce 才能運作，請先安裝並啟用 WooCommerce。', 'wp-variation-description' )
        . '</p></div>';
}

function wpvd_strip_variation_description( $data, $product, $variation ) {
    $data['variation_description_raw'] = $variation->get_description();
    $data['variation_description']     = '';
    return $data;
}

function wpvd_enqueue_assets() {
    if ( ! is_product() ) {
        return;
    }

    wp_enqueue_style(
        'wp-variation-description',
        WPVD_URL . 'assets/css/variation-description.css',
        array(),
        WPVD_VERSION
    );

    wp_enqueue_script(
        'wp-variation-description',
        WPVD_URL . 'assets/js/variation-description.js',
        array( 'jquery' ),
        WPVD_VERSION,
        true
    );
}

function wpvd_render_modal_html() {
    if ( ! is_product() ) {
        return;
    }
    ?>
    <div id="variation-description-modal" class="wpvd-modal" role="dialog" aria-modal="true" aria-labelledby="wpvd-modal-title">
        <div class="wpvd-modal__overlay"></div>
        <div class="wpvd-modal__content">
            <button class="wpvd-modal__close" aria-label="<?php esc_attr_e( '關閉', 'wp-variation-description' ); ?>">&times;</button>
            <div class="wpvd-modal__title" id="wpvd-modal-title"></div>
            <div class="wpvd-modal__body"></div>
        </div>
    </div>
    <?php
}
