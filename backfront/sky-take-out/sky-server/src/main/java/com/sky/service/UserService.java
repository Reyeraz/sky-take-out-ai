package com.sky.service;

import com.sky.dto.UserLoginDTO;
import com.sky.entity.Employee;

public interface UserService {

    /**
     * 用户登录
     * @param userLoginDTO
     * @return
     */
    Employee login(UserLoginDTO userLoginDTO);
}
