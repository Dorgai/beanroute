import { PrismaClient } from '@prisma/client';

// Default haircut percentage (15%)
const DEFAULT_HAIRCUT_PERCENTAGE = 15;

/**
 * Get the current haircut percentage
 * @param {PrismaClient} prisma - Prisma client instance
 * @returns {Promise<number>} The haircut percentage (0-100)
 */
export async function getHaircutPercentage(prisma) {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'coffee_processing_haircut_percentage' }
    });
    
    if (setting) {
      const percentage = parseFloat(setting.value);
      return isNaN(percentage) ? DEFAULT_HAIRCUT_PERCENTAGE : percentage;
    }
    
    // If no setting exists, create the default
    await prisma.systemSettings.create({
      data: {
        key: 'coffee_processing_haircut_percentage',
        value: DEFAULT_HAIRCUT_PERCENTAGE.toString()
      }
    });
    
    return DEFAULT_HAIRCUT_PERCENTAGE;
  } catch (error) {
    console.error('Error getting haircut percentage:', error);
    return DEFAULT_HAIRCUT_PERCENTAGE;
  }
}

/**
 * Update the haircut percentage (admin only)
 * @param {number} percentage - The new haircut percentage (0-100)
 * @param {string} userId - The user ID making the change
 * @param {PrismaClient} prisma - Prisma client instance
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function updateHaircutPercentage(percentage, userId, prisma) {
  try {
    // Validate percentage
    if (percentage < 0 || percentage > 100) {
      return {
        success: false,
        message: 'Haircut percentage must be between 0 and 100'
      };
    }
    
    // Update or create the setting
    await prisma.systemSettings.upsert({
      where: { key: 'coffee_processing_haircut_percentage' },
      update: { value: percentage.toString() },
      create: {
        key: 'coffee_processing_haircut_percentage',
        value: percentage.toString()
      }
    });
    
    // Log the change
    await prisma.userActivity.create({
      data: {
        userId,
        action: 'UPDATE',
        resource: 'SYSTEM_SETTINGS',
        resourceId: 'coffee_processing_haircut_percentage',
        details: JSON.stringify({
          setting: 'Coffee Processing Haircut Percentage',
          newValue: `${percentage}%`,
          previousValue: await getHaircutPercentage(prisma)
        })
      }
    });
    
    return {
      success: true,
      message: `Haircut percentage updated to ${percentage}%`
    };
  } catch (error) {
    console.error('Error updating haircut percentage:', error);
    return {
      success: false,
      message: 'Failed to update haircut percentage'
    };
  }
}

/**
 * Calculate the total green coffee consumption including haircut
 * @param {number} retailQuantity - The retail coffee quantity ordered (in kg)
 * @param {PrismaClient} prisma - Prisma client instance
 * @returns {Promise<number>} The total green coffee consumption including haircut (in kg)
 */
export async function calculateGreenCoffeeConsumption(retailQuantity, prisma) {
  try {
    const haircutPercentage = await getHaircutPercentage(prisma);
    const haircutMultiplier = 1 + (haircutPercentage / 100);
    return retailQuantity * haircutMultiplier;
  } catch (error) {
    console.error('Error calculating green coffee consumption:', error);
    // Fallback to default haircut
    return retailQuantity * (1 + (DEFAULT_HAIRCUT_PERCENTAGE / 100));
  }
}

/**
 * Calculate the haircut amount for a given retail quantity
 * @param {number} retailQuantity - The retail coffee quantity ordered (in kg)
 * @param {PrismaClient} prisma - Prisma client instance
 * @returns {Promise<number>} The haircut amount (in kg)
 */
export async function calculateHaircutAmount(retailQuantity, prisma) {
  try {
    const haircutPercentage = await getHaircutPercentage(prisma);
    return retailQuantity * (haircutPercentage / 100);
  } catch (error) {
    console.error('Error calculating haircut amount:', error);
    // Fallback to default haircut
    return retailQuantity * (DEFAULT_HAIRCUT_PERCENTAGE / 100);
  }
}

/**
 * Get comprehensive haircut information
 * @param {PrismaClient} prisma - Prisma client instance
 * @returns {Promise<Object>} Haircut information object
 */
export async function getHaircutInfo(prisma) {
  try {
    const percentage = await getHaircutPercentage(prisma);
    const multiplier = 1 + (percentage / 100);
    
    return {
      percentage,
      multiplier,
      description: `When retail coffee is ordered, green coffee stock is decreased by ${percentage}% more than the retail quantity to account for processing losses.`,
      examples: [
        {
          retailOrdered: '10 kg',
          haircutAmount: `${(10 * percentage / 100).toFixed(1)} kg`,
          totalGreenConsumption: `${(10 * multiplier).toFixed(1)} kg`
        },
        {
          retailOrdered: '25 kg',
          haircutAmount: `${(25 * percentage / 100).toFixed(1)} kg`,
          totalGreenConsumption: `${(25 * multiplier).toFixed(1)} kg`
        }
      ]
    };
  } catch (error) {
    console.error('Error getting haircut info:', error);
    return {
      percentage: DEFAULT_HAIRCUT_PERCENTAGE,
      multiplier: 1 + (DEFAULT_HAIRCUT_PERCENTAGE / 100),
      description: `Default haircut of ${DEFAULT_HAIRCUT_PERCENTAGE}% applied to processing losses.`,
      examples: []
    };
  }
}

export default {
  getHaircutPercentage,
  updateHaircutPercentage,
  calculateGreenCoffeeConsumption,
  calculateHaircutAmount,
  getHaircutInfo
};
