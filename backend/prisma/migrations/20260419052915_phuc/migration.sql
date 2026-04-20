BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [fullName] NVARCHAR(1000) NOT NULL,
    [phoneNumber] NVARCHAR(1000),
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [users_role_df] DEFAULT 'USER',
    [isActive] BIT NOT NULL CONSTRAINT [users_isActive_df] DEFAULT 1,
    [lastLoginAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[airports] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [city] NVARCHAR(1000) NOT NULL,
    [country] NVARCHAR(1000) NOT NULL,
    [timezone] NVARCHAR(1000) NOT NULL CONSTRAINT [airports_timezone_df] DEFAULT 'Asia/Ho_Chi_Minh',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [airports_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [airports_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [airports_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[aircraft] (
    [id] NVARCHAR(1000) NOT NULL,
    [model] NVARCHAR(1000) NOT NULL,
    [totalSeats] INT NOT NULL,
    [businessSeats] INT NOT NULL,
    [economySeats] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [aircraft_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [aircraft_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ticket_types] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [pricePercentage] FLOAT(53) NOT NULL,
    [minAge] INT,
    [maxAge] INT,
    [description] TEXT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ticket_types_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ticket_types_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ticket_types_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[routes] (
    [id] NVARCHAR(1000) NOT NULL,
    [departureId] NVARCHAR(1000) NOT NULL,
    [arrivalId] NVARCHAR(1000) NOT NULL,
    [distance] INT,
    [duration] INT,
    [standardPrice] FLOAT(53),
    [isActive] BIT NOT NULL CONSTRAINT [routes_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [routes_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [routes_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [routes_departureId_arrivalId_key] UNIQUE NONCLUSTERED ([departureId],[arrivalId])
);

-- CreateTable
CREATE TABLE [dbo].[flights] (
    [id] NVARCHAR(1000) NOT NULL,
    [flightNumber] NVARCHAR(1000) NOT NULL,
    [routeId] NVARCHAR(1000) NOT NULL,
    [aircraftId] NVARCHAR(1000) NOT NULL,
    [departureTime] DATETIME2 NOT NULL,
    [arrivalTime] DATETIME2 NOT NULL,
    [basePrice] FLOAT(53) NOT NULL,
    [businessPrice] FLOAT(53) NOT NULL,
    [promotionId] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [flights_isActive_df] DEFAULT 1,
    [notes] TEXT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [flights_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [flights_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [flights_flightNumber_key] UNIQUE NONCLUSTERED ([flightNumber])
);

-- CreateTable
CREATE TABLE [dbo].[seat_inventory] (
    [id] NVARCHAR(1000) NOT NULL,
    [flightId] NVARCHAR(1000) NOT NULL,
    [ticketClass] NVARCHAR(1000) NOT NULL,
    [availableSeats] INT NOT NULL,
    [bookedSeats] INT NOT NULL CONSTRAINT [seat_inventory_bookedSeats_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [seat_inventory_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [seat_inventory_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [seat_inventory_flightId_ticketClass_key] UNIQUE NONCLUSTERED ([flightId],[ticketClass])
);

-- CreateTable
CREATE TABLE [dbo].[seat_holds] (
    [id] NVARCHAR(1000) NOT NULL,
    [flightId] NVARCHAR(1000) NOT NULL,
    [seatNumber] NVARCHAR(1000) NOT NULL,
    [ticketClass] NVARCHAR(1000) NOT NULL,
    [bookingId] NVARCHAR(1000),
    [heldBy] NVARCHAR(1000),
    [expiresAt] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [seat_holds_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [seat_holds_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [seat_holds_flightId_seatNumber_key] UNIQUE NONCLUSTERED ([flightId],[seatNumber])
);

-- CreateTable
CREATE TABLE [dbo].[bookings] (
    [id] NVARCHAR(1000) NOT NULL,
    [bookingCode] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000),
    [flightId] NVARCHAR(1000) NOT NULL,
    [totalAmount] FLOAT(53) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [bookings_status_df] DEFAULT 'PENDING',
    [contactEmail] NVARCHAR(1000) NOT NULL,
    [contactPhone] NVARCHAR(1000) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [rejectedBy] NVARCHAR(1000),
    [rejectedAt] DATETIME2,
    [rejectionReason] TEXT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [bookings_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [bookings_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [bookings_bookingCode_key] UNIQUE NONCLUSTERED ([bookingCode])
);

-- CreateTable
CREATE TABLE [dbo].[booking_passengers] (
    [id] NVARCHAR(1000) NOT NULL,
    [bookingId] NVARCHAR(1000) NOT NULL,
    [ticketTypeId] NVARCHAR(1000) NOT NULL,
    [ticketClass] NVARCHAR(1000) NOT NULL,
    [fullName] NVARCHAR(1000) NOT NULL,
    [dateOfBirth] DATETIME2 NOT NULL,
    [calculatedAge] INT,
    [priceAmount] FLOAT(53) NOT NULL,
    [seatNumber] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [booking_passengers_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [booking_passengers_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[payments] (
    [id] NVARCHAR(1000) NOT NULL,
    [bookingId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000),
    [amount] FLOAT(53) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [payments_status_df] DEFAULT 'PENDING',
    [paymentMethod] NVARCHAR(1000) NOT NULL CONSTRAINT [payments_paymentMethod_df] DEFAULT 'MoMo',
    [transactionId] NVARCHAR(1000),
    [momoRequestId] NVARCHAR(1000),
    [momoOrderId] NVARCHAR(1000),
    [eTicketCode] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [payments_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [payments_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [payments_transactionId_key] UNIQUE NONCLUSTERED ([transactionId]),
    CONSTRAINT [payments_momoRequestId_key] UNIQUE NONCLUSTERED ([momoRequestId]),
    CONSTRAINT [payments_eTicketCode_key] UNIQUE NONCLUSTERED ([eTicketCode])
);

-- CreateTable
CREATE TABLE [dbo].[coupons] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [discountPercent] FLOAT(53) NOT NULL,
    [maxDiscount] FLOAT(53),
    [validFrom] DATETIME2 NOT NULL,
    [validTo] DATETIME2 NOT NULL,
    [usageLimit] INT,
    [usedCount] INT NOT NULL CONSTRAINT [coupons_usedCount_df] DEFAULT 0,
    [isActive] BIT NOT NULL CONSTRAINT [coupons_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [coupons_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [coupons_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [coupons_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [seat_holds_flightId_idx] ON [dbo].[seat_holds]([flightId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [seat_holds_expiresAt_idx] ON [dbo].[seat_holds]([expiresAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [bookings_bookingCode_idx] ON [dbo].[bookings]([bookingCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [bookings_userId_idx] ON [dbo].[bookings]([userId]);

-- AddForeignKey
ALTER TABLE [dbo].[routes] ADD CONSTRAINT [routes_departureId_fkey] FOREIGN KEY ([departureId]) REFERENCES [dbo].[airports]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[routes] ADD CONSTRAINT [routes_arrivalId_fkey] FOREIGN KEY ([arrivalId]) REFERENCES [dbo].[airports]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[flights] ADD CONSTRAINT [flights_routeId_fkey] FOREIGN KEY ([routeId]) REFERENCES [dbo].[routes]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[flights] ADD CONSTRAINT [flights_aircraftId_fkey] FOREIGN KEY ([aircraftId]) REFERENCES [dbo].[aircraft]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[flights] ADD CONSTRAINT [flights_promotionId_fkey] FOREIGN KEY ([promotionId]) REFERENCES [dbo].[coupons]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[seat_inventory] ADD CONSTRAINT [seat_inventory_flightId_fkey] FOREIGN KEY ([flightId]) REFERENCES [dbo].[flights]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[seat_holds] ADD CONSTRAINT [seat_holds_flightId_fkey] FOREIGN KEY ([flightId]) REFERENCES [dbo].[flights]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[bookings] ADD CONSTRAINT [bookings_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[bookings] ADD CONSTRAINT [bookings_flightId_fkey] FOREIGN KEY ([flightId]) REFERENCES [dbo].[flights]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[booking_passengers] ADD CONSTRAINT [booking_passengers_bookingId_fkey] FOREIGN KEY ([bookingId]) REFERENCES [dbo].[bookings]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[booking_passengers] ADD CONSTRAINT [booking_passengers_ticketTypeId_fkey] FOREIGN KEY ([ticketTypeId]) REFERENCES [dbo].[ticket_types]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[payments] ADD CONSTRAINT [payments_bookingId_fkey] FOREIGN KEY ([bookingId]) REFERENCES [dbo].[bookings]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[payments] ADD CONSTRAINT [payments_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
