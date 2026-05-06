<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'admin_menu', 'wpvd_add_admin_menu' );
function wpvd_add_admin_menu() {
    add_options_page(
        __( '變體說明顯示設定', 'wp-variation-description' ),
        __( '變體說明顯示', 'wp-variation-description' ),
        'manage_options',
        'wp-variation-description',
        'wpvd_render_settings_page'
    );
}

add_action( 'admin_init', 'wpvd_register_settings' );
function wpvd_register_settings() {
    register_setting(
        'wpvd_settings_group',
        'wpvd_settings',
        array(
            'sanitize_callback' => 'wpvd_sanitize_settings',
            'default'           => array( 'auto_show' => 0 ),
        )
    );

    add_settings_section(
        'wpvd_main_section',
        __( '一般設定', 'wp-variation-description' ),
        null,
        'wp-variation-description'
    );

    add_settings_field(
        'wpvd_auto_show',
        __( '自動顯示說明', 'wp-variation-description' ),
        'wpvd_render_auto_show_field',
        'wp-variation-description',
        'wpvd_main_section'
    );
}

function wpvd_sanitize_settings( $input ) {
    $output = array();
    $output['auto_show'] = ! empty( $input['auto_show'] ) ? 1 : 0;
    return $output;
}

function wpvd_render_auto_show_field() {
    $options   = get_option( 'wpvd_settings', array( 'auto_show' => 0 ) );
    $auto_show = ! empty( $options['auto_show'] ) ? 1 : 0;
    ?>
    <label for="wpvd_auto_show" style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;">
        <input
            type="checkbox"
            id="wpvd_auto_show"
            name="wpvd_settings[auto_show]"
            value="1"
            <?php checked( 1, $auto_show ); ?>
            style="margin-top:3px;"
        />
        <span>
            <?php esc_html_e( '當顧客首次點選含有說明的商品變體時，自動彈出說明視窗（每個工作階段僅觸發一次）。', 'wp-variation-description' ); ?>
            <br>
            <small style="color:#666;">
                <?php esc_html_e( '說明視窗關閉後，視窗內將顯示提示訊息，告知顧客可透過 ⓘ 圖示查看後續說明。', 'wp-variation-description' ); ?>
            </small>
        </span>
    </label>
    <?php
}

function wpvd_render_settings_page() {
    if ( ! current_user_can( 'manage_options' ) ) {
        return;
    }
    ?>
    <div class="wrap">
        <h1><?php esc_html_e( 'WooCommerce 變體說明顯示設定', 'wp-variation-description' ); ?></h1>
        <form method="post" action="options.php">
            <?php
            settings_fields( 'wpvd_settings_group' );
            do_settings_sections( 'wp-variation-description' );
            submit_button();
            ?>
        </form>
    </div>
    <?php
}
