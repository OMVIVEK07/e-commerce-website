export interface PincodeCheckResult {
  pincode: string;
  isServiceable: boolean;
  city?: string;
  state?: string;
  estimatedDeliveryDays: number;
  deliveryDate: string;
  isExpressAvailable: boolean;
  shippingFee: number;
}

const METRO_PINCODES: Record<string, { city: string; state: string }> = {
  '11': { city: 'New Delhi', state: 'Delhi' },
  '40': { city: 'Mumbai', state: 'Maharashtra' },
  '56': { city: 'Bengaluru', state: 'Karnataka' },
  '60': { city: 'Chennai', state: 'Tamil Nadu' },
  '70': { city: 'Kolkata', state: 'West Bengal' },
  '50': { city: 'Hyderabad', state: 'Telangana' },
  '38': { city: 'Ahmedabad', state: 'Gujarat' },
  '41': { city: 'Pune', state: 'Maharashtra' },
};

export const checkPincodeServiceability = (pincode: string): PincodeCheckResult => {
  const cleanPincode = pincode.trim();
  
  // Validate 6-digit numeric format
  if (!/^\d{6}$/.test(cleanPincode)) {
    return {
      pincode: cleanPincode,
      isServiceable: false,
      estimatedDeliveryDays: 0,
      deliveryDate: '',
      isExpressAvailable: false,
      shippingFee: 0,
    };
  }

  const prefix = cleanPincode.substring(0, 2);
  const isMetro = METRO_PINCODES[prefix];

  const days = isMetro ? 2 : 4;
  const deliveryDateObj = new Date();
  deliveryDateObj.setDate(deliveryDateObj.getDate() + days);

  const formattedDate = deliveryDateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return {
    pincode: cleanPincode,
    isServiceable: true,
    city: isMetro ? isMetro.city : 'Regional Location',
    state: isMetro ? isMetro.state : 'India',
    estimatedDeliveryDays: days,
    deliveryDate: formattedDate,
    isExpressAvailable: isMetro ? true : false,
    shippingFee: 0, // Free delivery above 999
  };
};
