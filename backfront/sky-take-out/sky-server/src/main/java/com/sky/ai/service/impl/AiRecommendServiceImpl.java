package com.sky.ai.service.impl;

import com.alibaba.fastjson2.JSON;
import com.sky.ai.service.AiService;
import com.sky.constant.StatusConstant;
import com.sky.dto.AiChatDTO;
import com.sky.dto.GoodsSalesDTO;
import com.sky.entity.*;
import com.sky.mapper.*;
import com.sky.result.Result;
import com.sky.vo.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AiRecommendServiceImpl implements AiService {

    @Autowired
    private ChatClient chatClient;

    @Autowired
    private OrderMapper orderMapper;

    @Autowired
    private OrderDetailMapper orderDetailMapper;

    @Autowired
    private DishMapper dishMapper;

    @Autowired
    private CategoryMapper categoryMapper;

    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;

    @Override
    public List<AiRecommendVO> recommend(Long userId) {
        String userProfile = buildUserProfile(userId);
        String dishesJson = getAvailableDishesJson();

        try {
            String response = chatClient.prompt()
                    .system("你是一个专业的外卖点餐推荐助手。你必须只返回纯JSON格式的数据，不要包含任何解释或markdown标记。")
                    .user("""
                            用户偏好：%s
                            
                            今日可售菜品（JSON格式）：%s
                            
                            请根据用户偏好和可售菜品，推荐5道菜品。返回格式：
                            {"recommendations":[{"dishId":数字,"reason":"推荐理由"}]}
                            
                            只返回JSON，不要其他内容。
                            """.formatted(userProfile, dishesJson))
                    .call()
                    .content();

            return parseRecommendResponse(response, dishesJson);
        } catch (Exception e) {
            log.warn("AI推荐调用失败，降级为规则推荐: {}", e.getMessage());
            return fallbackRecommend(userId);
        }
    }

    @Override
    public AiDailyVO getDailyRecommend() {
        String today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        String cacheKey = "ai:daily:" + today;

        if (redisTemplate != null) {
            try {
                Object cached = redisTemplate.opsForValue().get(cacheKey);
                if (cached != null) {
                    return JSON.parseObject(cached.toString(), AiDailyVO.class);
                }
            } catch (Exception e) {
                log.warn("Redis读取每日推荐缓存失败: {}", e.getMessage());
            }
        }

        String dishesJson = getAvailableDishesJson();
        String hotDishesJson = getHotDishesJson();

        try {
            String escapedDishesJson = dishesJson.replace("{", "\\{").replace("}", "\\}");
            String escapedHotJson = hotDishesJson.replace("{", "\\{").replace("}", "\\}");
            String response = chatClient.prompt()
                    .system("你是一个专业的外卖推荐助手。你必须只返回纯JSON格式的数据，不要包含任何解释或markdown标记。")
                    .user("""
                            今日可售菜品：%s
                            
                            近期热销菜品：%s
                            
                            请为今天推荐一个主题标语和6道推荐菜品。返回格式：
                            {"slogan":"今日主题标语","recommendations":[{"dishId":数字,"reason":"推荐理由"}]}
                            
                            只返回JSON，不要其他内容。
                            """.formatted(escapedDishesJson, escapedHotJson))
                    .call()
                    .content();

            AiDailyVO dailyVO = parseDailyResponse(response, today);

            if (redisTemplate != null && dailyVO != null) {
                try {
                    long secondsUntilMidnight = LocalDateTime.now().until(
                            LocalDate.now().plusDays(1).atStartOfDay(), java.time.temporal.ChronoUnit.SECONDS);
                    redisTemplate.opsForValue().set(cacheKey, JSON.toJSONString(dailyVO), secondsUntilMidnight, TimeUnit.SECONDS);
                } catch (Exception e) {
                    log.warn("Redis写入每日推荐缓存失败: {}", e.getMessage());
                }
            }

            return dailyVO;
        } catch (Exception e) {
            log.warn("AI每日推荐调用失败: {}", e.getMessage());
            return fallbackDailyRecommend(today);
        }
    }

    @Override
    public AiChatVO chat(Long userId, String message, List<AiChatDTO.ChatMessage> history) {
        String dishesJson = getAvailableDishesJson();

        try {
            String escapedDishesJson = dishesJson.replace("{", "\\{").replace("}", "\\}");
            String response = chatClient.prompt()
                    .system("你是一个友好的外卖点餐助手，名叫小苍。你可以帮用户推荐菜品、回答菜品相关问题。" +
                            "当前可售菜品：\n" + escapedDishesJson +
                            "\n如果用户问到菜品相关的问题，请根据上述菜品列表回答。" +
                            "回复时如果推荐了具体菜品，请在最后单独一行用JSON列出推荐菜品ID，格式：[id1,id2,...]")
                    .user(u -> u.text(message))
                    .call()
                    .content();

            return parseChatResponse(response);
        } catch (Exception e) {
            log.warn("AI对话调用失败: {}", e.getMessage());
            return AiChatVO.builder()
                    .reply("抱歉，AI助手暂时不可用，请稍后再试。")
                    .build();
        }
    }

    @Override
    public AiSalesAnalysisVO getSalesAnalysis(Integer days) {
        LocalDateTime beginTime = LocalDate.now().minusDays(days).atStartOfDay();
        LocalDateTime endTime = LocalDate.now().atTime(LocalTime.MAX);

        List<GoodsSalesDTO> top10 = orderMapper.getSalesTop10(beginTime, endTime);
        String salesData = JSON.toJSONString(top10);

        try {
            String response = chatClient.prompt()
                    .system("你是一个专业的餐饮数据分析师。你必须只返回纯JSON格式的数据。")
                    .user("""
                            近%d天销量排行数据：%s
                            
                            请分析数据并返回JSON：
                            {"summary":"总体分析","highlights":["亮点1","亮点2"],"warnings":["预警1"],"suggestions":["建议1"],"trendDescription":"趋势描述"}
                            
                            只返回JSON。
                            """.formatted(days, salesData))
                    .call()
                    .content();

            return parseSalesAnalysisResponse(response, days);
        } catch (Exception e) {
            log.warn("AI销售分析调用失败: {}", e.getMessage());
            return AiSalesAnalysisVO.builder()
                    .period("近" + days + "天")
                    .summary("AI服务暂时不可用，无法生成分析报告。")
                    .highlights(Collections.emptyList())
                    .warnings(Collections.emptyList())
                    .suggestions(Collections.emptyList())
                    .build();
        }
    }

    @Override
    public AiMenuSuggestionVO getMenuSuggestion() {
        Dish queryDish = new Dish();
        queryDish.setStatus(StatusConstant.ENABLE);
        List<Dish> allDishes = dishMapper.list(queryDish);
        List<Category> allCategories = categoryMapper.list(null);

        Map<String, String> categoryMap = allCategories.stream()
                .collect(Collectors.toMap(c -> c.getId().toString(), Category::getName, (a, b) -> a));

        String menuData = JSON.toJSONString(allDishes.stream()
                .map(d -> Map.of("name", d.getName(), "categoryId", d.getCategoryId().toString(), "price", d.getPrice()))
                .collect(Collectors.toList()));

        try {
            String response = chatClient.prompt()
                    .system("你是一个专业的餐饮菜单顾问。你必须只返回纯JSON格式的数据。")
                    .user("""
                            当前菜单数据：%s
                            分类映射：%s
                            
                            请分析并返回JSON：
                            {"promoteList":["应推广菜品"],"demoteList":["建议下架菜品"],"newCategoryIdeas":["建议新品类"],"summary":"总结建议"}
                            
                            只返回JSON。
                            """.formatted(menuData, JSON.toJSONString(categoryMap)))
                    .call()
                    .content();

            return parseMenuSuggestionResponse(response);
        } catch (Exception e) {
            log.warn("AI菜单建议调用失败: {}", e.getMessage());
            return AiMenuSuggestionVO.builder()
                    .summary("AI服务暂时不可用。")
                    .promoteList(Collections.emptyList())
                    .demoteList(Collections.emptyList())
                    .newCategoryIdeas(Collections.emptyList())
                    .build();
        }
    }

    @Override
    public List<String> generateDishDescription(String name, String categoryName, List<String> ingredients) {
        try {
            String response = chatClient.prompt()
                    .system("你是一个专业的美食文案撰写师。你必须只返回纯JSON格式的数据。")
                    .user("""
                            菜品名称：%s
                            分类：%s
                            食材：%s
                            
                            请生成3句吸引人的菜品描述文案。返回JSON格式：
                            ["描述1","描述2","描述3"]
                            
                            只返回JSON。
                            """.formatted(name, categoryName, String.join("、", ingredients)))
                    .call()
                    .content();

            return JSON.parseArray(response, String.class);
        } catch (Exception e) {
            log.warn("AI菜品描述生成失败: {}", e.getMessage());
            return List.of("精选优质食材，匠心烹制而成", "口感鲜美，回味无穷", "招牌推荐，不容错过");
        }
    }

    private String buildUserProfile(Long userId) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<Orders> orders = orderMapper.getCompletedOrdersByUserId(userId, thirtyDaysAgo);

        if (orders.isEmpty()) {
            return "新用户，暂无历史偏好";
        }

        List<Long> orderIds = orders.stream().map(Orders::getId).collect(Collectors.toList());
        List<OrderDetail> details = orderDetailMapper.getByOrderIds(orderIds);

        Map<String, Long> dishCount = details.stream()
                .collect(Collectors.groupingBy(OrderDetail::getName, Collectors.counting()));
        List<String> topDishes = dishCount.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        Set<Long> dishIds = details.stream().map(OrderDetail::getDishId).filter(Objects::nonNull).collect(Collectors.toSet());
        List<Dish> orderedDishes = dishIds.stream().map(dishMapper::getById).filter(Objects::nonNull).collect(Collectors.toList());
        Set<Long> categoryIds = orderedDishes.stream().map(Dish::getCategoryId).collect(Collectors.toSet());
        List<Category> categories = categoryMapper.list(null);
        String categoryNames = categories.stream()
                .filter(c -> categoryIds.contains(c.getId()))
                .map(Category::getName)
                .collect(Collectors.joining("、"));

        if (categoryNames.isEmpty()) categoryNames = "未有明显偏好";

        DoubleSummaryStatistics priceStats = details.stream()
                .filter(d -> d.getAmount() != null)
                .mapToDouble(d -> d.getAmount().doubleValue())
                .summaryStatistics();
        String priceRange = "¥%.0f ~ ¥%.0f".formatted(priceStats.getMin(), priceStats.getMax());

        int morningOrders = 0;
        int noonOrders = 0;
        int eveningOrders = 0;
        for (Orders o : orders) {
            int hour = o.getOrderTime().getHour();
            if (hour < 10) morningOrders++;
            else if (hour < 14) noonOrders++;
            else eveningOrders++;
        }
        String timePreference;
        if (noonOrders > morningOrders && noonOrders > eveningOrders) timePreference = "午餐";
        else if (morningOrders > eveningOrders) timePreference = "早餐";
        else timePreference = "晚餐";

        return "常点菜品：%s；偏好分类：%s；消费区间：%s；偏好时段：%s；历史订单数：%d"
                .formatted(String.join("、", topDishes), categoryNames, priceRange, timePreference, orders.size());
    }

    private String getAvailableDishesJson() {
        Dish query = new Dish();
        query.setStatus(StatusConstant.ENABLE);
        List<Dish> dishes = dishMapper.list(query);
        List<Category> categories = categoryMapper.list(null);
        Map<Long, String> catMap = categories.stream()
                .collect(Collectors.toMap(Category::getId, Category::getName, (a, b) -> a));

        List<Map<String, Object>> dishList = dishes.stream()
                .map(d -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("dishId", d.getId());
                    m.put("name", d.getName());
                    m.put("category", catMap.getOrDefault(d.getCategoryId(), "未知"));
                    m.put("price", d.getPrice());
                    m.put("description", d.getDescription() != null ? d.getDescription() : "");
                    return m;
                })
                .collect(Collectors.toList());
        return JSON.toJSONString(dishList);
    }

    private String getHotDishesJson() {
        LocalDateTime begin = LocalDate.now().minusDays(7).atStartOfDay();
        LocalDateTime end = LocalDate.now().atTime(LocalTime.MAX);
        List<GoodsSalesDTO> top10 = orderMapper.getSalesTop10(begin, end);
        return JSON.toJSONString(top10);
    }

    private List<AiRecommendVO> parseRecommendResponse(String response, String dishesJson) {
        try {
            List<? extends AiRecommendVO> list = JSON.parseObject(response)
                    .getJSONArray("recommendations")
                    .toJavaList(AiRecommendVO.class);

            List<Dish> dishes = JSON.parseArray(dishesJson, com.alibaba.fastjson2.JSONObject.class).stream()
                    .map(obj -> {
                        Dish d = new Dish();
                        d.setId(obj.getLong("dishId"));
                        d.setName(obj.getString("name"));
                        d.setPrice(obj.getBigDecimal("price"));
                        d.setImage(null);
                        return d;
                    }).collect(Collectors.toList());

            Map<Long, Dish> dishMap = dishes.stream().collect(Collectors.toMap(Dish::getId, d -> d, (a, b) -> a));

            return list.stream().map(vo -> {
                Dish dish = dishMap.get(vo.getDishId());
                if (dish != null) {
                    vo.setDishName(dish.getName());
                    vo.setPrice(dish.getPrice());
                    vo.setImage(dish.getImage());
                }
                return vo;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("解析AI推荐响应失败: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<AiRecommendVO> fallbackRecommend(Long userId) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<Orders> orders = orderMapper.getCompletedOrdersByUserId(userId, thirtyDaysAgo);
        if (orders.isEmpty()) {
            LocalDateTime begin = LocalDate.now().minusDays(30).atStartOfDay();
            LocalDateTime end = LocalDate.now().atTime(LocalTime.MAX);
            List<GoodsSalesDTO> top10 = orderMapper.getSalesTop10(begin, end);
            return top10.stream().limit(5).map(item -> AiRecommendVO.builder()
                    .dishName(item.getName())
                    .reason("近期热销")
                    .build()).collect(Collectors.toList());
        }
        List<Long> orderIds = orders.stream().map(Orders::getId).collect(Collectors.toList());
        List<OrderDetail> details = orderDetailMapper.getByOrderIds(orderIds);
        return details.stream()
                .collect(Collectors.groupingBy(OrderDetail::getName, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> AiRecommendVO.builder().dishName(e.getKey()).reason("根据您的点单习惯推荐").build())
                .collect(Collectors.toList());
    }

    private AiDailyVO parseDailyResponse(String response, String date) {
        try {
            com.alibaba.fastjson2.JSONObject obj = JSON.parseObject(response);
            String slogan = obj.getString("slogan");
            List<AiRecommendVO> list = obj.getJSONArray("recommendations").toJavaList(AiRecommendVO.class);

            Dish query = new Dish();
            query.setStatus(StatusConstant.ENABLE);
            List<Dish> allDishes = dishMapper.list(query);
            Map<Long, Dish> dishMap = allDishes.stream().collect(Collectors.toMap(Dish::getId, d -> d, (a, b) -> a));

            list.forEach(vo -> {
                Dish dish = dishMap.get(vo.getDishId());
                if (dish != null) {
                    vo.setDishName(dish.getName());
                    vo.setPrice(dish.getPrice());
                    vo.setImage(dish.getImage());
                }
            });

            return AiDailyVO.builder().date(date).slogan(slogan).recommendations(list).build();
        } catch (Exception e) {
            log.warn("解析每日推荐响应失败: {}", e.getMessage());
            return fallbackDailyRecommend(date);
        }
    }

    private AiDailyVO fallbackDailyRecommend(String date) {
        LocalDateTime begin = LocalDate.now().minusDays(7).atStartOfDay();
        LocalDateTime end = LocalDate.now().atTime(LocalTime.MAX);
        List<GoodsSalesDTO> top10 = orderMapper.getSalesTop10(begin, end);

        Dish query = new Dish();
        query.setStatus(StatusConstant.ENABLE);
        List<Dish> allDishes = dishMapper.list(query);
        Map<String, Dish> dishByName = allDishes.stream()
                .collect(Collectors.toMap(Dish::getName, d -> d, (a, b) -> a));

        List<AiRecommendVO> list = top10.stream().limit(6).map(item -> {
            Dish dish = dishByName.get(item.getName());
            return AiRecommendVO.builder()
                    .dishId(dish != null ? dish.getId() : null)
                    .dishName(item.getName())
                    .price(dish != null ? dish.getPrice() : null)
                    .image(dish != null ? dish.getImage() : null)
                    .reason("近期热销")
                    .build();
        }).collect(Collectors.toList());

        return AiDailyVO.builder().date(date).slogan("今日精选推荐").recommendations(list).build();
    }

    private AiChatVO parseChatResponse(String response) {
        List<Long> dishIds = new ArrayList<>();
        List<String> dishNames = new ArrayList<>();
        String reply = response;

        int lastBracket = response.lastIndexOf('[');
        int lastClose = response.lastIndexOf(']');
        if (lastBracket > 0 && lastClose > lastBracket) {
            String idsPart = response.substring(lastBracket, lastClose + 1);
            try {
                dishIds = JSON.parseArray(idsPart, Long.class);
                reply = response.substring(0, lastBracket).trim();
            } catch (Exception ignored) {
            }
        }

        if (!dishIds.isEmpty()) {
            Dish query = new Dish();
            query.setStatus(StatusConstant.ENABLE);
            List<Dish> allDishes = dishMapper.list(query);
            Map<Long, String> idToName = allDishes.stream()
                    .collect(Collectors.toMap(Dish::getId, Dish::getName, (a, b) -> a));
            dishNames = dishIds.stream()
                    .map(id -> idToName.getOrDefault(id, "未知菜品"))
                    .collect(Collectors.toList());
        }

        return AiChatVO.builder()
                .reply(reply)
                .suggestedDishIds(dishIds)
                .suggestedDishNames(dishNames)
                .build();
    }

    private AiSalesAnalysisVO parseSalesAnalysisResponse(String response, Integer days) {
        try {
            com.alibaba.fastjson2.JSONObject obj = JSON.parseObject(response);
            return AiSalesAnalysisVO.builder()
                    .period("近" + days + "天")
                    .summary(obj.getString("summary"))
                    .highlights(obj.getJSONArray("highlights").toJavaList(String.class))
                    .warnings(obj.getJSONArray("warnings").toJavaList(String.class))
                    .suggestions(obj.getJSONArray("suggestions").toJavaList(String.class))
                    .trendDescription(obj.getString("trendDescription"))
                    .build();
        } catch (Exception e) {
            log.warn("解析销售分析响应失败: {}", e.getMessage());
            return AiSalesAnalysisVO.builder()
                    .period("近" + days + "天")
                    .summary("数据解析失败，请稍后重试。")
                    .build();
        }
    }

    private AiMenuSuggestionVO parseMenuSuggestionResponse(String response) {
        try {
            com.alibaba.fastjson2.JSONObject obj = JSON.parseObject(response);
            return AiMenuSuggestionVO.builder()
                    .promoteList(obj.getJSONArray("promoteList").toJavaList(String.class))
                    .demoteList(obj.getJSONArray("demoteList").toJavaList(String.class))
                    .newCategoryIdeas(obj.getJSONArray("newCategoryIdeas").toJavaList(String.class))
                    .summary(obj.getString("summary"))
                    .build();
        } catch (Exception e) {
            log.warn("解析菜单建议响应失败: {}", e.getMessage());
            return AiMenuSuggestionVO.builder()
                    .summary("数据解析失败，请稍后重试。")
                    .build();
        }
    }
}
