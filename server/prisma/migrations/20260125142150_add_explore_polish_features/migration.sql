/*
  Warnings:

  - Added the required column `original_content` to the `dreams` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Step 1: 先添加字段为可选
ALTER TABLE `dreams` ADD COLUMN `current_version_id` VARCHAR(191) NULL,
    ADD COLUMN `is_public` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `like_count` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `original_content` TEXT NULL,
    ADD COLUMN `view_count` INTEGER NOT NULL DEFAULT 0;

-- Step 2: 用现有 content 填充 original_content
UPDATE `dreams` SET `original_content` = `content` WHERE `original_content` IS NULL;

-- Step 3: 将 original_content 改为必需
ALTER TABLE `dreams` MODIFY COLUMN `original_content` TEXT NOT NULL;

-- CreateTable
CREATE TABLE `dream_versions` (
    `id` VARCHAR(191) NOT NULL,
    `dream_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `type` ENUM('original', 'polished') NOT NULL,
    `content` TEXT NOT NULL,
    `polished_from` VARCHAR(191) NULL,
    `polish_prompt` TEXT NULL,
    `ai_model` VARCHAR(64) NULL,
    `tokens_used` INTEGER NULL,
    `version_number` INTEGER NOT NULL,
    `is_current` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `dream_versions_dream_id_created_at_idx`(`dream_id`, `created_at`),
    INDEX `dream_versions_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `explore_views` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `viewer_id` VARCHAR(191) NOT NULL,
    `dream_id` VARCHAR(191) NOT NULL,
    `author_id` VARCHAR(191) NOT NULL,
    `view_duration` INTEGER NULL,
    `is_liked` BOOLEAN NOT NULL DEFAULT false,
    `source` VARCHAR(16) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `explore_views_viewer_id_idx`(`viewer_id`),
    INDEX `explore_views_dream_id_idx`(`dream_id`),
    INDEX `explore_views_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `polish_quotas` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `total` INTEGER NOT NULL DEFAULT 3,
    `used` INTEGER NOT NULL DEFAULT 0,
    `remaining` INTEGER NOT NULL DEFAULT 3,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `polish_quotas_user_id_date_idx`(`user_id`, `date`),
    UNIQUE INDEX `polish_quotas_user_id_date_key`(`user_id`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `dreams_is_public_created_at_idx` ON `dreams`(`is_public`, `created_at`);

-- CreateIndex
CREATE INDEX `dreams_is_public_tags_idx` ON `dreams`(`is_public`, `tags`);

-- AddForeignKey
ALTER TABLE `dream_versions` ADD CONSTRAINT `dream_versions_dream_id_fkey` FOREIGN KEY (`dream_id`) REFERENCES `dreams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `explore_views` ADD CONSTRAINT `explore_views_dream_id_fkey` FOREIGN KEY (`dream_id`) REFERENCES `dreams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
