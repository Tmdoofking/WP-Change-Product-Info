<?php
/**
 * Plugin Name: WooCommerce Variation Description Display
 * Plugin URI:  https://github.com/tmdoofking/wp-change-product-info
 * Description: 為 WooCommerce 變體選項新增說明圖示與彈窗，支援首次自動顯示功能。
 * Version:     1.1.0
 * Author:      tmdoofking
 * License:     GPL-2.0+
 * Text Domain: wp-variation-description
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'WPVD_VERSION', '1.1.0' );
define( 'WPVD_DIR', plugin_dir_path( __FILE__ ) );
define( 'WPVD_URL', plugin_dir_url( __FILE__ ) );

require_once WPVD_DIR . 'includes/admin-settings.php';

// ── Remove default variation description from data ────────────────────────────
add_filter( 'woocommerce_available_variation', 'wpvd_remove_default_variation_description', 10, 3 );
function wpvd_remove_default_variation_description( $data, $product, $variation ) {
    $data['variation_description_raw'] = $variation->get_description();
    $data['variation_description']     = '';
    return $data;
}

// ── Enqueue assets on single product pages ────────────────────────────────────
add_action( 'wp_enqueue_scripts', 'wpvd_enqueue_assets' );
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

    $options = get_option( 'wpvd_settings', array() );

    wp_localize_script(
        'wp-variation-description',
        'wpvdSettings',
        array(
            'autoShow'    => ! empty( $options['auto_show'] ) ? '1' : '0',
            'hintText'    => esc_html__( '若對其他商品變體有疑問，後續請點選 ⓘ 即可查看說明。', 'wp-variation-description' ),
            'modalTitle'  => esc_html__( '變體說明', 'wp-variation-description' ),
        )
    );
}

// ── Render modal HTML in footer ───────────────────────────────────────────────
add_action( 'wp_footer', 'wpvd_render_modal_html' );
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
            <div class="wpvd-modal__hint" id="wpvd-auto-hint" style="display:none;">
                <span class="wpvd-hint__icon">ⓘ</span>
                <span class="wpvd-hint__text"></span>
            </div>
        </div>
    </div>
    <?php
}
