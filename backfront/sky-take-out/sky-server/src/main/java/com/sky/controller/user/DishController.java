package com.sky.controller.user;

import com.alibaba.fastjson2.JSON;
import com.sky.constant.StatusConstant;
import com.sky.entity.Dish;
import com.sky.result.Result;
import com.sky.service.DishService;
import com.sky.vo.DishVO;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Operation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController("userDishController")
@RequestMapping("/user/dish")
@Slf4j
@Tag(name = "C端-菜品浏览接口")
public class DishController {
    @Autowired
    private DishService dishService;
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * 根据分类id查询菜品
     *
     * @param categoryId
     * @return
     */
    @GetMapping("/list")
    @Operation(summary = "根据分类id查询菜品")
    public Result<List<DishVO>> list(Long categoryId) {

        String key = "dish_" + categoryId;

        //查询redis中是否存在菜品数据
        try {
            Object cached = redisTemplate.opsForValue().get(key);
            if (cached != null) {
                List<DishVO> list = JSON.parseArray(cached.toString(), DishVO.class);
                if (list != null && !list.isEmpty()) {
                    log.info("Redis缓存命中 key={}", key);
                    return Result.success(list);
                }
            }
        } catch (Exception e) {
            log.warn("Redis查询缓存失败，从数据库查询: {}", e.getMessage());
        }

        Dish dish = new Dish();
        dish.setCategoryId(categoryId);
        dish.setStatus(StatusConstant.ENABLE);

        //如果不存在，查询数据库，将查询到的数据放入redis中
        List<DishVO> list = dishService.listWithFlavor(dish);
        try {
            redisTemplate.opsForValue().set(key, JSON.toJSONString(list));
            log.info("Redis缓存写入成功 key={}, 菜品数={}", key, list.size());
        } catch (Exception e) {
            log.warn("Redis写入缓存失败: {}", e.getMessage());
        }

        return Result.success(list);
    }

}
