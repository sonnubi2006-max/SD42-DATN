package com.base.service.impl;

import com.base.dto.request.conversation.SendMessageRequest;
import com.base.dto.response.conversation.MessageResponse;
import com.base.dto.response.order.OrderSummaryResponse;
import com.base.entity.Conversation;
import com.base.entity.Customer;
import com.base.entity.Message;
import com.base.entity.Order;
import com.base.exception.ForbiddenException;
import com.base.mapper.OrderMapper;
import com.base.queue.ImageUploadProducer;
import com.base.repository.ConversationAssignmentRepository;
import com.base.repository.ConversationRepository;
import com.base.repository.CustomerRepository;
import com.base.repository.MessageRepository;
import com.base.repository.OrderRepository;
import com.base.repository.UserRepository;
import com.base.service.SocketIOService;
import com.base.utils.SecurityUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceImplTest {

    @Mock private ConversationRepository conversationRepository;
    @Mock private MessageRepository messageRepository;
    @Mock private UserRepository userRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private SecurityUtils securityUtils;
    @Mock private SocketIOService socketIOService;
    @Mock private LocalStorageService localStorageService;
    @Mock private ImageUploadProducer imageUploadProducer;
    @Mock private ConversationAssignmentRepository conversationAssignmentRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private OrderMapper orderMapper;

    @InjectMocks private ChatServiceImpl chatService;

    private Customer customer;
    private Conversation conversation;

    @BeforeEach
    void setUp() {
        customer = Customer.builder()
                .customerId(1L)
                .email("customer@example.com")
                .fullName("Khách hàng")
                .build();
        conversation = Conversation.builder()
                .conversationId(10L)
                .customer(customer)
                .status(Conversation.ConversationStatus.OPEN)
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "customer@example.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                )
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void sendOrderMessagePersistsOrderReference() {
        Order order = Order.builder()
                .orderId(20L)
                .orderCode("ORD-20")
                .customer(customer)
                .build();
        OrderSummaryResponse summary = new OrderSummaryResponse();
        summary.setOrderId(20L);

        when(securityUtils.getCurrentUserId()).thenReturn(1L);
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(orderRepository.findByIdWithDetails(20L)).thenReturn(Optional.of(order));
        when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderMapper.toSummaryResponse(order)).thenReturn(summary);

        MessageResponse response = chatService.sendMessage(10L, orderRequest(20L), null);

        ArgumentCaptor<Message> captor = ArgumentCaptor.forClass(Message.class);
        verify(messageRepository).save(captor.capture());
        assertSame(order, captor.getValue().getOrder());
        assertEquals(20L, response.getOrderId());
        assertEquals("[Đơn hàng #ORD-20]", conversation.getLastMessage());
    }

    @Test
    void sendOrderMessageRejectsOrderOwnedByAnotherCustomer() {
        Customer otherCustomer = Customer.builder().customerId(2L).email("other@example.com").build();
        Order order = Order.builder()
                .orderId(21L)
                .orderCode("ORD-21")
                .customer(otherCustomer)
                .build();

        when(securityUtils.getCurrentUserId()).thenReturn(1L);
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));
        when(orderRepository.findByIdWithDetails(21L)).thenReturn(Optional.of(order));

        assertThrows(ForbiddenException.class, () ->
                chatService.sendMessage(10L, orderRequest(21L), null));
        verify(messageRepository, never()).save(any(Message.class));
    }

    private SendMessageRequest orderRequest(Long orderId) {
        return SendMessageRequest.builder()
                .messageType(Message.MessageType.ORDER)
                .messageContent("Thông tin đơn hàng")
                .orderId(orderId)
                .build();
    }
}
