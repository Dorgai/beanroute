-- Emergency database fix script for Railway production
-- Run this in your Railway PostgreSQL database SQL editor

-- 1. Fix Shop table - add missing columns
DO $$ 
BEGIN
    -- Add minCoffeeQuantityEspresso if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Shop' 
        AND column_name = 'minCoffeeQuantityEspresso'
    ) THEN
        ALTER TABLE "public"."Shop" 
        ADD COLUMN "minCoffeeQuantityEspresso" INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added minCoffeeQuantityEspresso column to Shop table';
    ELSE
        RAISE NOTICE 'minCoffeeQuantityEspresso column already exists';
    END IF;

    -- Add minCoffeeQuantityFilter if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Shop' 
        AND column_name = 'minCoffeeQuantityFilter'
    ) THEN
        ALTER TABLE "public"."Shop" 
        ADD COLUMN "minCoffeeQuantityFilter" INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added minCoffeeQuantityFilter column to Shop table';
    ELSE
        RAISE NOTICE 'minCoffeeQuantityFilter column already exists';
    END IF;
END $$;

-- 2. Create PushSubscription table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'PushSubscription'
    ) THEN
        -- Create the PushSubscription table
        CREATE TABLE "public"."PushSubscription" (
            "id" TEXT NOT NULL,
            "endpoint" TEXT NOT NULL,
            "p256dh" TEXT NOT NULL,
            "auth" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
        );
        
        -- Create indexes
        CREATE INDEX "PushSubscription_userId_idx" 
        ON "public"."PushSubscription"("userId");
        
        CREATE INDEX "PushSubscription_endpoint_idx" 
        ON "public"."PushSubscription"("endpoint");
        
        -- Add foreign key constraint
        ALTER TABLE "public"."PushSubscription" 
        ADD CONSTRAINT "PushSubscription_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "public"."User"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE 'Created PushSubscription table with indexes and constraints';
    ELSE
        RAISE NOTICE 'PushSubscription table already exists';
    END IF;
END $$;

-- 3. Verify the fixes
SELECT 
    'Shop table columns' as check_type,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'Shop' 
AND column_name IN ('minCoffeeQuantityEspresso', 'minCoffeeQuantityFilter')
ORDER BY column_name;

SELECT 
    'PushSubscription table' as check_type,
    table_name,
    'exists' as status
FROM information_schema.tables 
WHERE table_name = 'PushSubscription';

-- 4. Show summary
SELECT 'Database fix completed successfully!' as message;
