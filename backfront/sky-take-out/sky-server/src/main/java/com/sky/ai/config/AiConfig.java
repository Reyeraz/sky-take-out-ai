package com.sky.ai.config;

import com.alibaba.cloud.ai.graph.agent.ReactAgent;
import com.alibaba.cloud.ai.graph.checkpoint.savers.MemorySaver;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder.build();
    }

    @Bean
    public ReactAgent chatAgent(ChatClient chatClient, ToolCallback[] dishToolCallbacks) {
        return ReactAgent.builder()
                .name("sky_take_out_agent")
                .chatClient(chatClient)
                .tools(dishToolCallbacks)
                .systemPrompt("""
                        你是小苍，一个专业的外卖点餐助手。你可以帮用户推荐菜品、回答菜品相关问题。
                        你可以使用提供的工具来查询菜品信息、热销排行、分类列表。
                        如果用户问到菜品相关问题，请先使用工具查询，再根据结果回答。
                        回复时如果推荐了具体菜品，请在最后单独一行用JSON列出推荐菜品ID，格式：[id1,id2,...]
                        """)
                .saver(new MemorySaver())
                .build();
    }

    @Bean
    public ToolCallback[] dishToolCallbacks(com.sky.ai.tool.DishTools dishTools) {
        return MethodToolCallbackProvider.builder()
                .toolObjects(dishTools)
                .build()
                .getToolCallbacks();
    }
}
