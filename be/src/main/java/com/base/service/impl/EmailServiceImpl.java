package com.base.service.impl;

import com.base.dto.event.EmailMessage;
import com.base.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    @Override
    public void send(
            EmailMessage message
    ) {

        try {

            MimeMessage mimeMessage =
                    mailSender.createMimeMessage();

            MimeMessageHelper helper =
                    new MimeMessageHelper(
                            mimeMessage,
                            true,
                            "UTF-8"
                    );

            helper.setFrom(from);
            helper.setTo(message.getTo());

            helper.setSubject(
                    buildSubject(message)
            );

            helper.setText(
                    buildHtml(message),
                    true
            );

            mailSender.send(mimeMessage);

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private String buildSubject(
            EmailMessage message
    ) {
        if (message.getType() == null) {
            throw new IllegalArgumentException("Email message type cannot be null");
        }

        return switch (message.getType().name()) {

            case "ACCOUNT_CREATED" ->
                    "Tài khoản nhân viên của bạn đã được tạo";

            case "ORDER_CONFIRMATION" ->
                    "Đặt hàng thành công - #" + message.getData().get("orderCode");

            case "OTP" ->
                    "Mã xác thực OTP";

            case "FORGOT_PASSWORD" ->
                    "Khôi phục mật khẩu";

            case "SHIPPING_UPDATE" ->
                    "Cập nhật trạng thái giao hàng";

            case "PROMOTION" ->
                    "Khuyến mãi mới";

            case "PERSONAL_COUPON_ASSIGNED" ->
                    "Bạn vừa nhận được mã giảm giá cá nhân " + dataText(message, "couponCode");

            case "PERSONAL_COUPON_UNAVAILABLE" ->
                    "Mã giảm giá cá nhân " + dataText(message, "couponCode") + " không còn khả dụng";

            default ->
                    throw new IllegalArgumentException("Unknown email type: " + message.getType());
        };
    }

    private String buildHtml(
            EmailMessage message
    ) {
        if (message.getType() == null) {
            throw new IllegalArgumentException("Email message type cannot be null");
        }

        return switch (message.getType().name()) {

            case "ACCOUNT_CREATED" ->
                    buildAccountCreatedEmail(message);

            case "ORDER_CONFIRMATION" ->
                    buildOrderConfirmation(message);

            case "OTP" ->
                    buildOtpEmail(message);

            case "FORGOT_PASSWORD" ->
                    buildForgotPasswordEmail(message);

            case "SHIPPING_UPDATE" ->
                    buildShippingEmail(message);

            case "PROMOTION" ->
                    buildPromotionEmail(message);

            case "PERSONAL_COUPON_ASSIGNED" ->
                    buildPersonalCouponAssignedEmail(message);

            case "PERSONAL_COUPON_UNAVAILABLE" ->
                    buildPersonalCouponUnavailableEmail(message);

            default ->
                    throw new IllegalArgumentException("Unknown email type: " + message.getType());
        };
    }

    private String wrapInTemplate(String title, String recipientName, String bodyContent) {
        String greeting = recipientName != null
                ? "Xin chào " + escapeHtml(recipientName) + ","
                : "Xin chào Quý khách,";
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>%s</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="background-color: #f4f5f7; padding: 20px 0;">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);">
                            <tr>
                                <td style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 30px 40px; text-align: center;">
                                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">%s</h1>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 40px; color: #374151; font-size: 15px; line-height: 1.6;">
                                    <p style="margin-top: 0; margin-bottom: 20px; font-size: 16px; font-weight: 600; color: #111827;">%s</p>
                                    %s
                                </td>
                            </tr>

                            <tr>
                                <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #f3f4f6; color: #9ca3af; font-size: 12px;">
                                    <p style="margin: 0 0 8px 0; font-weight: 600; color: #6b7280;">Hệ Thống Quản Lý Cửa Hàng Store</p>
                                    <p style="margin: 0 0 16px 0;">Đây là email tự động từ hệ thống, vui lòng không trả lời trực tiếp email này.</p>
                                    <p style="margin: 0;">&copy; 2026 Store. All rights reserved.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """.formatted(title, title, greeting, bodyContent);
    }

    private String buildAccountCreatedEmail(
            EmailMessage message
    ) {
        String username = (String) message.getData().get("username");
        String password = (String) message.getData().get("password");
        String loginUrl = (String) message.getData().get("loginUrl");

        String body = """
            <p style="margin-bottom: 20px;">Tài khoản nhân viên của bạn đã được khởi tạo thành công trên hệ thống. Vui lòng sử dụng thông tin đăng nhập dưới đây để truy cập hệ thống quản trị:</p>

            <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="background-color: #f3f4f6; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                    <td style="padding: 15px 20px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%%">
                            <tr>
                                <td width="130" style="color: #6b7280; font-size: 14px; padding-bottom: 8px;">Tên đăng nhập:</td>
                                <td style="color: #111827; font-size: 14px; font-weight: bold; padding-bottom: 8px;">%s</td>
                            </tr>
                            <tr>
                                <td style="color: #6b7280; font-size: 14px;">Mật khẩu:</td>
                                <td style="color: #111827; font-size: 14px; font-weight: bold;">%s</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <p style="text-align: center; margin: 30px 0;">
                <a href="%s" style="background-color: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 6px; display: inline-block; box-shadow: 0 2px 5px rgba(37, 99, 235, 0.2);">Đăng Nhập Hệ Thống</a>
            </p>

            <p style="margin-bottom: 0; font-size: 13px; color: #ef4444; font-style: italic;">* Vì lý do bảo mật, vui lòng thay đổi mật khẩu ngay sau lần đăng nhập đầu tiên.</p>
            """.formatted(username, password, loginUrl);

        return wrapInTemplate("Tài khoản nhân viên đã được tạo", message.getRecipientName(), body);
    }

    private String buildOrderConfirmation(
            EmailMessage message
    ) {
        Long orderId = message.getData().get("orderId") != null
                ? ((Number) message.getData().get("orderId")).longValue()
                : null;
        String orderCode = (String) message.getData().get("orderCode");
        Object finalAmountRaw = message.getData().get("finalAmount");
        String finalAmountStr = finalAmountRaw != null
                ? String.format("%,.0f đ", ((Number) finalAmountRaw).doubleValue())
                : "0 đ";
        String receiverName = escapeHtml(dataText(message, "receiverName"));
        String receiverPhone = escapeHtml(dataText(message, "receiverPhone"));
        String receiverAddress = escapeHtml(dataText(message, "receiverAddress"));

        String body = """
            <p style="margin-bottom: 20px;">Đơn hàng của bạn đã được tiếp nhận thành công. Chúng tôi đang kiểm tra và chuẩn bị sản phẩm để giao tới bạn trong thời gian sớm nhất.</p>

            <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="background-color: #f3f4f6; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                    <td style="padding: 15px 20px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%%">
                            <tr>
                                <td width="130" style="color: #6b7280; font-size: 14px; padding-bottom: 8px;">Mã đơn hàng:</td>
                                <td style="color: #2563eb; font-size: 14px; font-weight: bold; padding-bottom: 8px;">#%s (ID: %d)</td>
                            </tr>
                            <tr>
                                <td style="color: #6b7280; font-size: 14px; padding-bottom: 8px;">Tổng thanh toán:</td>
                                <td style="font-size: 16px; font-weight: bold; color: #dc2626; padding-bottom: 8px;">%s</td>
                            </tr>
                            <tr>
                                <td style="color: #6b7280; font-size: 14px; padding-bottom: 8px;">Người nhận:</td>
                                <td style="color: #111827; font-size: 14px; font-weight: bold; padding-bottom: 8px;">%s</td>
                            </tr>
                            <tr>
                                <td style="color: #6b7280; font-size: 14px; padding-bottom: 8px;">Điện thoại nhận:</td>
                                <td style="color: #111827; font-size: 14px; padding-bottom: 8px;">%s</td>
                            </tr>
                            <tr>
                                <td style="color: #6b7280; font-size: 14px; vertical-align: top;">Địa chỉ giao:</td>
                                <td style="color: #111827; font-size: 14px;">%s</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <p style="margin-bottom: 0;">Bạn sẽ nhận được thông báo tiếp theo qua email khi trạng thái giao hàng của đơn hàng được cập nhật.</p>
            """.formatted(escapeHtml(orderCode), orderId, finalAmountStr,
                receiverName, receiverPhone, receiverAddress);

        return wrapInTemplate("Xác nhận đơn hàng thành công", message.getRecipientName(), body);
    }

    private String buildOtpEmail(
            EmailMessage message
    ) {
        String otp = (String) message.getData().get("otp");

        String body = """
            <p style="margin-bottom: 20px;">Bạn đang thực hiện thao tác xác thực trên hệ thống. Dưới đây là mã xác thực OTP của bạn:</p>

            <div style="text-align: center; margin: 30px 0; background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
                <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e3a8a;">%s</span>
            </div>

            <p style="margin-bottom: 0; font-size: 13px; color: #6b7280;">* Mã xác thực này có hiệu lực trong vòng <b>5 phút</b>. Vui lòng tuyệt đối không chia sẻ mã này với bất kỳ ai khác.</p>
            """.formatted(otp);

        return wrapInTemplate("Mã xác thực OTP tài khoản", message.getRecipientName(), body);
    }

    private String buildForgotPasswordEmail(
            EmailMessage message
    ) {
        String resetUrl = (String) message.getData().get("resetUrl");
        long expirationMinutes = message.getData().get("expirationMinutes") != null 
                ? ((Number) message.getData().get("expirationMinutes")).longValue()
                : 15;

        String body = """
            <p style="margin-bottom: 20px;">Hệ thống nhận được yêu cầu khôi phục mật khẩu từ bạn. Vui lòng bấm vào nút liên kết dưới đây để thực hiện đặt lại mật khẩu mới:</p>

            <p style="text-align: center; margin: 30px 0;">
                <a href="%s" style="background-color: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 6px; display: inline-block; box-shadow: 0 2px 5px rgba(37, 99, 235, 0.2);">Đặt Lại Mật Khẩu</a>
            </p>

            <p style="margin-bottom: 0; font-size: 13px; color: #6b7280;">* Đường dẫn khôi phục mật khẩu này sẽ hết hiệu lực trong vòng <b>%d phút</b>. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email.</p>
            """.formatted(resetUrl, expirationMinutes);

        return wrapInTemplate("Yêu cầu khôi phục mật khẩu", message.getRecipientName(), body);
    }

    private String buildShippingEmail(
            EmailMessage message
    ) {
        String statusVi = message.getData().get("statusVi") != null
                ? (String) message.getData().get("statusVi")
                : (String) message.getData().get("status");
        Long orderId = message.getData().get("orderId") != null
                ? ((Number) message.getData().get("orderId")).longValue()
                : null;
        String orderCode = message.getData().get("orderCode") != null
                ? (String) message.getData().get("orderCode")
                : ("#" + orderId);

        String body = """
            <p style="margin-bottom: 20px;">Chúng tôi xin cập nhật trạng thái mới nhất cho đơn hàng của bạn:</p>

            <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="background-color: #f3f4f6; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                    <td style="padding: 15px 20px;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%%">
                            <tr>
                                <td width="130" style="color: #6b7280; font-size: 14px; padding-bottom: 8px;">Mã đơn hàng:</td>
                                <td style="color: #111827; font-size: 14px; font-weight: bold; padding-bottom: 8px;">%s</td>
                            </tr>
                            <tr>
                                <td style="color: #6b7280; font-size: 14px;">Trạng thái đơn:</td>
                                <td style="color: #2563eb; font-size: 15px; font-weight: bold; color: #2563eb;">%s</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <p style="margin-bottom: 0;">Nếu quý khách có bất kỳ thắc mắc nào, vui lòng liên hệ bộ phận hỗ trợ chăm sóc khách hàng của chúng tôi để được tư vấn và giải quyết kịp thời.</p>
            """.formatted(orderCode, statusVi);

        return wrapInTemplate("Cập nhật trạng thái đơn hàng", message.getRecipientName(), body);
    }

    private String buildPromotionEmail(
            EmailMessage message
    ) {
        String title = (String) message.getData().get("title");
        String content = (String) message.getData().get("content");

        String formattedContent = content != null ? content.replace("\n", "<br/>") : "";

        String body = """
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px 20px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1e40af;">%s</p>
            </div>

            <div style="font-size: 14px; color: #4b5563; line-height: 1.7;">
                %s
            </div>

            <p style="margin-top: 30px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                Cảm ơn bạn đã đồng ý nhận tin khuyến mãi từ chúng tôi.<br/>
                Nếu bạn không muốn tiếp tục nhận những email như thế này, vui lòng <a href="#" style="color: #3b82f6; text-decoration: underline;">Hủy đăng ký nhận tin</a>.
            </p>
            """.formatted(title, formattedContent);

        return wrapInTemplate("Thông tin ưu đãi dành riêng cho bạn", message.getRecipientName(), body);
    }

    private String buildPersonalCouponAssignedEmail(EmailMessage message) {
        String couponCode = escapeHtml(dataText(message, "couponCode"));
        String description = escapeHtml(dataText(message, "description"));
        String discountText = escapeHtml(dataText(message, "discountText"));
        String minOrderValue = escapeHtml(dataText(message, "minOrderValue"));
        String startDate = escapeHtml(dataText(message, "startDate"));
        String endDate = escapeHtml(dataText(message, "endDate"));

        String body = """
            <p style="margin-bottom: 20px;">Một ưu đãi cá nhân vừa được thêm vào tài khoản của bạn.</p>

            <div style="background: linear-gradient(135deg, #eff6ff, #eef2ff); border: 1px solid #bfdbfe; border-radius: 12px; padding: 22px; margin-bottom: 24px; text-align: center;">
                <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">Mã giảm giá của bạn</p>
                <p style="margin: 0; color: #1d4ed8; font-family: monospace; font-size: 28px; font-weight: 800; letter-spacing: 2px;">%s</p>
                <p style="margin: 12px 0 0; color: #0f172a; font-size: 16px; font-weight: 700;">%s</p>
            </div>

            <table border="0" cellpadding="0" cellspacing="0" width="100%%" style="background-color: #f8fafc; border-radius: 8px; margin-bottom: 22px;">
                <tr><td style="padding: 14px 18px; color: #64748b;">Ưu đãi</td><td style="padding: 14px 18px; text-align: right; font-weight: 700; color: #dc2626;">%s</td></tr>
                <tr><td style="padding: 0 18px 14px; color: #64748b;">Đơn hàng tối thiểu</td><td style="padding: 0 18px 14px; text-align: right; font-weight: 600;">%s</td></tr>
                <tr><td style="padding: 0 18px 14px; color: #64748b;">Thời gian áp dụng</td><td style="padding: 0 18px 14px; text-align: right; font-weight: 600;">%s – %s</td></tr>
            </table>

            <p style="margin-bottom: 0; color: #475569;">Hãy đăng nhập bằng đúng tài khoản nhận email này để sử dụng ưu đãi.</p>
            """.formatted(couponCode, description, discountText, minOrderValue, startDate, endDate);

        return wrapInTemplate("Ưu đãi cá nhân dành cho bạn", message.getRecipientName(), body);
    }

    private String buildPersonalCouponUnavailableEmail(EmailMessage message) {
        String couponCode = escapeHtml(dataText(message, "couponCode"));
        String reason = escapeHtml(dataText(message, "reason"));

        String body = """
            <p style="margin-bottom: 20px;">Chúng tôi xin thông báo mã giảm giá cá nhân dưới đây không còn khả dụng với tài khoản của bạn:</p>

            <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 18px 20px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 8px; color: #9f1239; font-family: monospace; font-size: 22px; font-weight: 800;">%s</p>
                <p style="margin: 0; color: #881337; font-size: 14px;">%s</p>
            </div>

            <p style="margin-bottom: 0; color: #475569;">Các đơn hàng đã áp dụng mã trước đó không bị ảnh hưởng bởi thay đổi này.</p>
            """.formatted(couponCode, reason);

        return wrapInTemplate("Cập nhật quyền sử dụng ưu đãi", message.getRecipientName(), body);
    }

    private String dataText(EmailMessage message, String key) {
        Object value = message.getData() != null ? message.getData().get(key) : null;
        return value != null && !value.toString().isBlank() ? value.toString() : "-";
    }

    private String escapeHtml(String value) {
        if (value == null) return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
