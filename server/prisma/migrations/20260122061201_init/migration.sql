-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `open_id` VARCHAR(191) NOT NULL,
    `union_id` VARCHAR(191) NULL,
    `nickname` VARCHAR(191) NOT NULL DEFAULT '梦游者',
    `avatar` VARCHAR(512) NULL,
    `gender` INTEGER NOT NULL DEFAULT 0,
    `phone` VARCHAR(20) NULL,
    `is_vip` BOOLEAN NOT NULL DEFAULT false,
    `vip_expire_at` DATETIME(3) NULL,
    `lucky_points` INTEGER NOT NULL DEFAULT 0,
    `consecutive_days` INTEGER NOT NULL DEFAULT 0,
    `last_dream_date` DATE NULL,
    `total_dreams` INTEGER NOT NULL DEFAULT 0,
    `total_tasks` INTEGER NOT NULL DEFAULT 0,
    `status` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_open_id_key`(`open_id`),
    INDEX `users_union_id_idx`(`union_id`),
    INDEX `users_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dreams` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `tags` VARCHAR(255) NULL,
    `emotion` VARCHAR(32) NULL,
    `word_count` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('pending', 'analyzed', 'deleted') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `dreams_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `dreams_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `analyses` (
    `id` VARCHAR(191) NOT NULL,
    `dream_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `status` ENUM('processing', 'completed', 'failed') NOT NULL DEFAULT 'processing',
    `theme` VARCHAR(128) NULL,
    `interpretation` TEXT NULL,
    `fortune_score` INTEGER NULL,
    `fortune_tips` TEXT NULL,
    `ai_model` VARCHAR(64) NULL,
    `tokens_used` INTEGER NULL,
    `latency` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `analyses_dream_id_key`(`dream_id`),
    INDEX `analyses_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tasks` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `dream_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(16) NOT NULL,
    `content` VARCHAR(256) NOT NULL,
    `reward_points` INTEGER NOT NULL DEFAULT 10,
    `status` ENUM('pending', 'completed', 'expired') NOT NULL DEFAULT 'pending',
    `is_double_reward` BOOLEAN NOT NULL DEFAULT false,
    `completed_at` DATETIME(3) NULL,
    `expire_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tasks_dream_id_key`(`dream_id`),
    INDEX `tasks_user_id_idx`(`user_id`),
    INDEX `tasks_status_expire_at_idx`(`status`, `expire_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `point_records` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `type` ENUM('earn', 'consume') NOT NULL,
    `amount` INTEGER NOT NULL,
    `balance` INTEGER NOT NULL,
    `source` VARCHAR(32) NOT NULL,
    `source_id` VARCHAR(64) NULL,
    `description` VARCHAR(128) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `point_records_user_id_idx`(`user_id`),
    INDEX `point_records_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `order_no` VARCHAR(191) NOT NULL,
    `type` ENUM('vip') NOT NULL,
    `product_id` VARCHAR(191) NOT NULL,
    `product_name` VARCHAR(64) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `pay_amount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('pending', 'paid', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
    `pay_type` VARCHAR(16) NULL,
    `transaction_id` VARCHAR(64) NULL,
    `paid_at` DATETIME(3) NULL,
    `expire_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_order_no_key`(`order_no`),
    INDEX `orders_user_id_idx`(`user_id`),
    INDEX `orders_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vip_plans` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(32) NOT NULL,
    `duration_days` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `original_price` DECIMAL(10, 2) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ad_records` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `ad_type` VARCHAR(16) NOT NULL,
    `position` VARCHAR(32) NOT NULL,
    `event_type` VARCHAR(16) NOT NULL,
    `duration` INTEGER NULL,
    `error_msg` VARCHAR(256) NULL,
    `token` VARCHAR(64) NULL,
    `token_used` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ad_records_user_id_idx`(`user_id`),
    INDEX `ad_records_token_idx`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `achievements` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `description` VARCHAR(256) NOT NULL,
    `icon` VARCHAR(32) NOT NULL,
    `condition_type` VARCHAR(32) NOT NULL,
    `condition_value` INTEGER NOT NULL,
    `reward_points` INTEGER NOT NULL DEFAULT 0,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_achievements` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `achievement_id` VARCHAR(191) NOT NULL,
    `unlocked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_achievements_user_id_idx`(`user_id`),
    UNIQUE INDEX `user_achievements_user_id_achievement_id_key`(`user_id`, `achievement_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(64) NOT NULL,
    `value` TEXT NOT NULL,
    `description` VARCHAR(256) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `configs_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `dreams` ADD CONSTRAINT `dreams_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `analyses` ADD CONSTRAINT `analyses_dream_id_fkey` FOREIGN KEY (`dream_id`) REFERENCES `dreams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_dream_id_fkey` FOREIGN KEY (`dream_id`) REFERENCES `dreams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `point_records` ADD CONSTRAINT `point_records_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ad_records` ADD CONSTRAINT `ad_records_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_achievements` ADD CONSTRAINT `user_achievements_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_achievements` ADD CONSTRAINT `user_achievements_achievement_id_fkey` FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
