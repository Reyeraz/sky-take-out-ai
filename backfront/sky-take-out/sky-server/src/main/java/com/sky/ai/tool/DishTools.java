package com.sky.ai.tool;

import com.alibaba.fastjson2.JSON;
import com.sky.constant.StatusConstant;
import com.sky.entity.*;
import com.sky.mapper.CategoryMapper;
import com.sky.mapper.DishMapper;
import com.sky.mapper.OrderMapper;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class DishTools {

    private final DishMapper dishMapper;
    private final CategoryMapper categoryMapper;
    private final OrderMapper orderMapper;

    public DishTools(DishMapper dishMapper, CategoryMapper categoryMapper, OrderMapper orderMapper) {
        this.dishMapper = dishMapper;
        this.categoryMapper = categoryMapper;
        this.orderMapper = orderMapper;
    }

    @Tool(description = "搜索可售菜品。输入关键词，返回匹配的菜品名称、ID、价格和分类。")
    public String searchDishes(@ToolParam(description = "搜索关键词，如菜名或分类名") String keyword) {
        Dish query = new Dish();
        query.setStatus(StatusConstant.ENABLE);
        List<Dish> all = dishMapper.list(query);
        List<Category> categories = categoryMapper.list(null);
        Map<Long, String> catMap = categories.stream()
                .collect(Collectors.toMap(Category::getId, Category::getName, (a, b) -> a));

        String kw = keyword.toLowerCase();
        List<Map<String, Object>> results = all.stream()
                .filter(d -> d.getName().toLowerCase().contains(kw)
                        || catMap.getOrDefault(d.getCategoryId(), "").toLowerCase().contains(kw))
                .limit(10)
                .map(d -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("dishId", d.getId());
                    m.put("name", d.getName());
                    m.put("price", d.getPrice());
                    m.put("category", catMap.getOrDefault(d.getCategoryId(), "未知"));
                    m.put("description", d.getDescription() != null ? d.getDescription() : "");
                    return m;
                })
                .collect(Collectors.toList());
        return JSON.toJSONString(results);
    }

    @Tool(description = "获取近期热销菜品排行。返回销量前10的菜品名称和销量。")
    public String getHotDishes(@ToolParam(description = "统计天数，默认7天") Integer days) {
        int d = days != null ? days : 7;
        LocalDateTime begin = LocalDate.now().minusDays(d).atStartOfDay();
        LocalDateTime end = LocalDate.now().atTime(LocalTime.MAX);
        var top10 = orderMapper.getSalesTop10(begin, end);
        return JSON.toJSONString(top10.stream().limit(10).map(item -> Map.of(
                "name", item.getName(),
                "sales", item.getNumber() != null ? item.getNumber() : 0
        )).collect(Collectors.toList()));
    }

    @Tool(description = "列出所有菜品分类。返回分类ID和名称列表。")
    public String listCategories() {
        List<Category> categories = categoryMapper.list(null);
        return JSON.toJSONString(categories.stream()
                .map(c -> Map.of("categoryId", c.getId(), "name", c.getName()))
                .collect(Collectors.toList()));
    }

    @Tool(description = "获取某个分类下的可售菜品列表。返回菜品ID、名称、价格和描述。")
    public String getDishesByCategory(@ToolParam(description = "分类名称") String categoryName) {
        List<Category> categories = categoryMapper.list(null);
        Long categoryId = categories.stream()
                .filter(c -> c.getName().equals(categoryName))
                .findFirst()
                .map(Category::getId)
                .orElse(null);

        Dish query = new Dish();
        query.setStatus(StatusConstant.ENABLE);
        if (categoryId != null) {
            query.setCategoryId(categoryId);
        }
        List<Dish> dishes = dishMapper.list(query);

        if (categoryId != null) {
            dishes = dishes.stream()
                    .filter(d -> categoryId.equals(d.getCategoryId()))
                    .collect(Collectors.toList());
        }

        return JSON.toJSONString(dishes.stream().map(d -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("dishId", d.getId());
            m.put("name", d.getName());
            m.put("price", d.getPrice());
            m.put("description", d.getDescription() != null ? d.getDescription() : "");
            return m;
        }).collect(Collectors.toList()));
    }

    @Tool(description = "获取菜品详细信息。返回菜品的名称、价格、描述、分类和图片。")
    public String getDishDetail(@ToolParam(description = "菜品ID") Long dishId) {
        Dish dish = dishMapper.getById(dishId);
        if (dish == null) {
            return "菜品不存在";
        }
        List<Category> categories = categoryMapper.list(null);
        String catName = categories.stream()
                .filter(c -> c.getId().equals(dish.getCategoryId()))
                .findFirst()
                .map(Category::getName)
                .orElse("未知");

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("dishId", dish.getId());
        m.put("name", dish.getName());
        m.put("price", dish.getPrice());
        m.put("category", catName);
        m.put("description", dish.getDescription() != null ? dish.getDescription() : "");
        m.put("image", dish.getImage());
        m.put("status", dish.getStatus() == StatusConstant.ENABLE ? "可售" : "停售");
        return JSON.toJSONString(m);
    }

    @Tool(description = "获取指定天数的销售排行数据，用于经营分析。返回菜品名称、销量和金额。")
    public String getSalesTop10(@ToolParam(description = "统计天数") Integer days) {
        int d = days != null ? days : 7;
        LocalDateTime begin = LocalDate.now().minusDays(d).atStartOfDay();
        LocalDateTime end = LocalDate.now().atTime(LocalTime.MAX);
        var top10 = orderMapper.getSalesTop10(begin, end);
        return JSON.toJSONString(top10.stream().limit(10).map(item -> Map.of(
                "name", item.getName(),
                "sales", item.getNumber() != null ? item.getNumber() : 0
        )).collect(Collectors.toList()));
    }

    @Tool(description = "获取所有可售菜品的完整列表（含ID、名称、价格、分类），用于推荐和菜单分析。")
    public String getAllAvailableDishes() {
        Dish query = new Dish();
        query.setStatus(StatusConstant.ENABLE);
        List<Dish> dishes = dishMapper.list(query);
        List<Category> categories = categoryMapper.list(null);
        Map<Long, String> catMap = categories.stream()
                .collect(Collectors.toMap(Category::getId, Category::getName, (a, b) -> a));

        return JSON.toJSONString(dishes.stream().map(d -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("dishId", d.getId());
            m.put("name", d.getName());
            m.put("price", d.getPrice());
            m.put("category", catMap.getOrDefault(d.getCategoryId(), "未知"));
            return m;
        }).collect(Collectors.toList()));
    }
}
