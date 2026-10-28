-- MARK: permission phân quyền
create table if not exists tb_permission
(
    -- primary
    id_permission bigint not null auto_increment,
    uuid_permission varchar(36) not null unique default (UUID()),
    
    -- properties
    name_permission text,

    -- key
    primary key (id_permission),
    
    -- timestamp
    created_at timestamp default current_timestamp,
    created_by bigint default '0',
    updated_at timestamp default current_timestamp on update current_timestamp,
    updated_by bigint default '0'
);

-- MARK: role phân quyền
create table if not exists tb_user_permission
(
    -- foreign
    id_permission bigint,
    id_nhan_vien bigint, -- sync data hi time sheet

    -- key
    unique (id_permission, id_nhan_vien),
    
    -- timestamp
    created_at timestamp default current_timestamp,
    created_by bigint default '0',
    updated_at timestamp default current_timestamp on update current_timestamp,
    updated_by bigint default '0'
);

-- MARK: combo mã hàng - chuyền
create table if not exists tb_plan
(
    -- primary
    id_plan bigint not null auto_increment,
    uuid_plan varchar(36) not null unique default (UUID()),
    
    -- properties
    product text,
    line text,

    -- key
    primary key (id_plan),
    
    -- timestamp
    created_at timestamp default current_timestamp,
    created_by bigint default '0',
    updated_at timestamp default current_timestamp on update current_timestamp,
    updated_by bigint default '0'
);

-- MARK: insert data
insert into tb_permission (name_permission) values ('admin'), ('edit'), ('view');
