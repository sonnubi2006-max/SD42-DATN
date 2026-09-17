package com.base.service;

import com.base.repository.ConversationRepository;
import com.base.repository.UserRepository;
import com.base.repository.CustomerRepository;
import com.base.security.jwt.JwtService;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class SocketIOService {

    private final SocketIOServer server;
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final CustomerRepository customerRepository;
    private final JwtService jwtService;

    private final Map<String, String> onlineAccounts = new ConcurrentHashMap<>();

    @PostConstruct
    public void start() {

        server.addConnectListener(client -> {
            String token = client.getHandshakeData().getSingleUrlParam("token");
            log.info("Socket connect attempt with token: {}", token != null ? (token.substring(0, Math.min(10, token.length())) + "...") : "null");
            ClientIdentity identity = getIdentityFromClient(client);
            if (identity != null) {
                onlineAccounts.put(identity.key(), client.getSessionId().toString());
                log.info("Socket connection successful: {} {} registered online",
                        identity.type(), identity.accountId());

                if (identity.type() == AccountType.USER) {
                    userRepository.findById(identity.accountId()).ifPresent(user -> {
                        if (user.getRole().name().equals("STAFF")
                                || user.getRole().name().equals("ADMIN")) {
                            client.joinRoom("staff-room");
                            log.info("User {} joined staff-room", identity.accountId());
                        }
                    });
                }
            } else {
                log.warn("Socket connect failed: account identity is null. Handshake token was invalid or expired.");
            }
        });

        server.addDisconnectListener(client -> {
            onlineAccounts.entrySet().removeIf(
                    e -> e.getValue().equals(client.getSessionId().toString())
            );
            log.info("Socket client disconnected: {}", client.getSessionId());
        });

        server.addEventListener("join_conversation", Long.class,
                (client, conversationId, ack) -> {
                    log.info("Socket request to join_conversation room. conversationId: {}", conversationId);
                    ClientIdentity identity = getIdentityFromClient(client);
                    if (identity == null) {
                        log.warn("Failed to join conversation room: account identity is null");
                        return;
                    }

                    conversationRepository.findById(conversationId).ifPresentOrElse(conv -> {
                        boolean isCustomerOwner = identity.type() == AccountType.CUSTOMER
                                && conv.getCustomer().getCustomerId().equals(identity.accountId());
                        boolean isAssignedStaff = identity.type() == AccountType.USER
                                && conv.getStaff() != null
                                && conv.getStaff().getUserId().equals(identity.accountId());
                        boolean isAdmin = identity.type() == AccountType.USER
                                && userRepository.findById(identity.accountId())
                                .map(u -> u.getRole().name().equals("ADMIN"))
                                .orElse(false);

                        log.info("Join conversation room check. conversationId: {}, accountType: {}, accountId: {}, isCustomerOwner: {}, isAssignedStaff: {}, isAdmin: {}",
                                conversationId, identity.type(), identity.accountId(),
                                isCustomerOwner, isAssignedStaff, isAdmin);

                        if (isCustomerOwner || isAssignedStaff || isAdmin) {
                            client.joinRoom("conversation-" + conversationId);
                            log.info("Client {} successfully joined room: conversation-{}", client.getSessionId(), conversationId);
                            if (ack.isAckRequested()) ack.sendAckData("joined");
                        } else {
                            log.warn("Access denied for client {} to join room conversation-{}", client.getSessionId(), conversationId);
                        }
                    }, () -> {
                        log.warn("Conversation {} not found in database", conversationId);
                    });
                });

        server.addEventListener("leave_conversation", Long.class,
                (client, conversationId, ack) -> {
                    client.leaveRoom("conversation-" + conversationId);
                });

        server.start();
    }

    @PreDestroy
    public void stop() {
        server.stop();
    }

    public void sendToCustomer(Long customerId, String event, Object data) {
        sendToAccount(AccountType.CUSTOMER, customerId, event, data);
    }

    public void sendToUser(Long userId, String event, Object data) {
        sendToAccount(AccountType.USER, userId, event, data);
    }

    private void sendToAccount(AccountType type, Long accountId, String event, Object data) {
        String socketId = onlineAccounts.get(accountKey(type, accountId));
        if (socketId != null) {
            SocketIOClient client = server.getClient(UUID.fromString(socketId));
            if (client != null) {
                client.sendEvent(event, data);
            }
        }
    }

    public void sendToRoom(String room, String event, Object data) {
        server.getRoomOperations(room).sendEvent(event, data);
    }

    public boolean isCustomerOnline(Long customerId) {
        return onlineAccounts.containsKey(accountKey(AccountType.CUSTOMER, customerId));
    }

    public boolean isUserOnline(Long userId) {
        return onlineAccounts.containsKey(accountKey(AccountType.USER, userId));
    }

    private ClientIdentity getIdentityFromClient(SocketIOClient client) {
        try {
            String token = client.getHandshakeData().getSingleUrlParam("token");
            if (token != null && !token.isBlank()) {
                String username = jwtService.extractUsername(token);
                if (username != null) {
                    var customerOpt = customerRepository.findByEmail(username);
                    if (customerOpt.isPresent()) {
                        return new ClientIdentity(
                                AccountType.CUSTOMER,
                                customerOpt.get().getCustomerId()
                        );
                    }

                    var userOpt = userRepository.findByUsername(username);
                    if (userOpt.isPresent()) {
                        return new ClientIdentity(
                                AccountType.USER,
                                userOpt.get().getUserId()
                        );
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error parsing JWT from socket handshake: {}", e.getMessage());
        }
        return null;
    }

    private String accountKey(AccountType type, Long accountId) {
        return type.name() + ":" + accountId;
    }

    private enum AccountType {
        CUSTOMER,
        USER
    }

    private record ClientIdentity(AccountType type, Long accountId) {
        private String key() {
            return type.name() + ":" + accountId;
        }
    }
}
