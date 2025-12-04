import { ColorTemperature } from './types';

export const COLOR_TEMPERATURES: ColorTemperature[] = [
  { 
    id: '2700k', 
    kelvin: '2700K', 
    color: '#FFB46B', 
    description: 'Warm White' 
  },
  { 
    id: '3000k', 
    kelvin: '3000K', 
    color: '#FFD18E', 
    description: 'Soft White' 
  },
  { 
    id: '4000k', 
    kelvin: '4000K', 
    color: '#FFF2D7', 
    description: 'Cool White' 
  },
  { 
    id: '5000k', 
    kelvin: '5000K', 
    color: '#E3F2FD', 
    description: 'Daylight' 
  },
];

export const STRIPE_CONFIG = {
  PLANS: {
    MONTHLY: {
      id: 'price_monthly_12345', // REPLACE WITH REAL STRIPE PRICE ID
      name: 'Pro Monthly',
      price: 49,
      interval: 'month',
      label: '$49 / mo'
    },
    YEARLY: {
      id: 'price_yearly_67890', // REPLACE WITH REAL STRIPE PRICE ID
      name: 'Pro Yearly',
      price: 499,
      interval: 'year',
      label: '$499 / yr',
      savings: 'Save 15%'
    }
  }
};