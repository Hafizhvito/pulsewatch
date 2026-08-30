-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Monitor` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `url` VARCHAR(2048) NOT NULL,
    `method` ENUM('GET', 'POST', 'HEAD') NOT NULL DEFAULT 'GET',
    `expectedStatus` INTEGER NOT NULL DEFAULT 200,
    `timeoutMs` INTEGER NOT NULL DEFAULT 10000,
    `intervalMinutes` INTEGER NOT NULL DEFAULT 5,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `currentStatus` ENUM('UNKNOWN', 'UP', 'DOWN') NOT NULL DEFAULT 'UNKNOWN',
    `lastCheckedAt` DATETIME(3) NULL,
    `lastResponseTime` INTEGER NULL,
    `leaseToken` VARCHAR(191) NULL,
    `leaseUntil` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Monitor_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `Monitor_isActive_lastCheckedAt_idx`(`isActive`, `lastCheckedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MonitorCheck` (
    `id` VARCHAR(191) NOT NULL,
    `monitorId` VARCHAR(191) NOT NULL,
    `status` ENUM('UNKNOWN', 'UP', 'DOWN') NOT NULL,
    `statusCode` INTEGER NULL,
    `responseTimeMs` INTEGER NULL,
    `errorMessage` VARCHAR(500) NULL,
    `checkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MonitorCheck_monitorId_checkedAt_idx`(`monitorId`, `checkedAt`),
    INDEX `MonitorCheck_checkedAt_idx`(`checkedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Incident` (
    `id` VARCHAR(191) NOT NULL,
    `monitorId` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolvedAt` DATETIME(3) NULL,
    `cause` VARCHAR(500) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Incident_monitorId_startedAt_idx`(`monitorId`, `startedAt`),
    INDEX `Incident_monitorId_resolvedAt_idx`(`monitorId`, `resolvedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Monitor` ADD CONSTRAINT `Monitor_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MonitorCheck` ADD CONSTRAINT `MonitorCheck_monitorId_fkey` FOREIGN KEY (`monitorId`) REFERENCES `Monitor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Incident` ADD CONSTRAINT `Incident_monitorId_fkey` FOREIGN KEY (`monitorId`) REFERENCES `Monitor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
