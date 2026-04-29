package com.sky.controller.user;

import com.alibaba.fastjson2.JSON;
import com.sky.ai.service.AiService;
import com.sky.context.BaseContext;
import com.sky.dto.AiChatDTO;
import com.sky.result.Result;
import com.sky.vo.AiChatVO;
import com.sky.vo.AiDailyVO;
import com.sky.vo.AiRecommendVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.publisher.Flux;

import java.util.List;

@RestController
@RequestMapping("/user/ai")
@Tag(name = "C端AI智能接口")
@Slf4j
public class AiController {

    @Autowired
    private AiService aiService;

    @PostMapping("/recommend")
    @Operation(summary = "AI智能推荐")
    public Result<List<AiRecommendVO>> recommend() {
        Long userId = BaseContext.getCurrentId();
        log.info("AI智能推荐, userId: {}", userId);
        List<AiRecommendVO> result = aiService.recommend(userId);
        return Result.success(result);
    }

    @GetMapping("/daily")
    @Operation(summary = "今日AI推荐")
    public Result<AiDailyVO> daily() {
        log.info("获取今日AI推荐");
        AiDailyVO result = aiService.getDailyRecommend();
        return Result.success(result);
    }

    @PostMapping("/chat")
    @Operation(summary = "AI点餐助手对话")
    public Result<AiChatVO> chat(@RequestBody AiChatDTO aiChatDTO) {
        Long userId = BaseContext.getCurrentId();
        log.info("AI对话, userId: {}, message: {}", userId, aiChatDTO.getMessage());
        AiChatVO result = aiService.chat(userId, aiChatDTO.getMessage(), aiChatDTO.getHistory());
        return Result.success(result);
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "AI点餐助手流式对话")
    public SseEmitter chatStream(@RequestBody AiChatDTO aiChatDTO) {
        Long userId = BaseContext.getCurrentId();
        log.info("AI流式对话, userId: {}, message: {}", userId, aiChatDTO.getMessage());

        SseEmitter emitter = new SseEmitter(300000L);
        StringBuilder fullContent = new StringBuilder();

        try {
            Flux<String> stream = aiService.chatStream(userId, aiChatDTO.getMessage(), aiChatDTO.getHistory());
            stream
                    .doOnNext(chunk -> {
                        try {
                            fullContent.append(chunk);
                            emitter.send(SseEmitter.event().data(chunk));
                        } catch (Exception e) {
                            log.warn("SSE发送数据失败: {}", e.getMessage());
                        }
                    })
                    .doOnComplete(() -> {
                        try {
                            AiChatVO parsed = aiService.parseChatResponse(fullContent.toString());
                            emitter.send(SseEmitter.event()
                                    .name("meta")
                                    .data(JSON.toJSONString(parsed)));
                            emitter.complete();
                        } catch (Exception e) {
                            log.warn("SSE发送meta失败: {}", e.getMessage());
                            emitter.complete();
                        }
                    })
                    .doOnError(error -> {
                        log.warn("AI流式对话失败: {}", error.getMessage());
                        try {
                            emitter.send(SseEmitter.event()
                                    .name("error")
                                    .data("抱歉，AI助手暂时不可用，请稍后再试。"));
                            emitter.complete();
                        } catch (Exception ex) {
                            emitter.completeWithError(ex);
                        }
                    })
                    .subscribe();
        } catch (Exception e) {
            log.warn("AI流式对话调用失败: {}", e.getMessage());
            try {
                emitter.send(SseEmitter.event()
                        .name("error")
                        .data("抱歉，AI助手暂时不可用，请稍后再试。"));
                emitter.complete();
            } catch (Exception ex) {
                emitter.completeWithError(ex);
            }
        }

        return emitter;
    }
}
