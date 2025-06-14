import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Phone, Mail, Clock, Navigation } from 'lucide-react';
import type { StoreLocation } from '@/../../shared/schema';

export default function StoreLocator() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: stores, isLoading } = useQuery<StoreLocation[]>({
    queryKey: ['/api/store-locations'],
  });

  const filteredStores = stores?.filter(store => 
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.address.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleGetDirections = (store: StoreLocation) => {
    if (store.googleMapsUrl) {
      window.open(store.googleMapsUrl, '_blank');
    } else if (store.latitude && store.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`, '_blank');
    }
  };

  const formatOpeningHours = (hours: any): string => {
    if (!hours || typeof hours !== 'object') return 'Hours not available';
    
    const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const formattedHours = daysOrder.map(day => {
      const dayHours = hours[day];
      if (!dayHours) return null;
      const dayName = day.charAt(0).toUpperCase() + day.slice(1);
      return `${dayName}: ${dayHours}`;
    }).filter(Boolean);
    
    return formattedHours.join(', ') || 'Hours not available';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading store locations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Our Stores</h1>
            <p className="text-gray-600">Discover DDM Jewellers locations near you</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by city, area, or store name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>

        {/* Store Count */}
        <div className="text-center mb-6">
          <Badge variant="secondary" className="px-4 py-2">
            {filteredStores.length} store{filteredStores.length !== 1 ? 's' : ''} found
          </Badge>
        </div>

        {/* Stores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <Card key={store.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="text-lg font-semibold">{store.name}</span>
                  {store.isActive ? (
                    <Badge className="bg-green-100 text-green-800">Open</Badge>
                  ) : (
                    <Badge variant="secondary">Closed</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                    <span className="text-sm">{store.address}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Location Details */}
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">{store.city}, {store.state}</span>
                    <span className="text-gray-600 ml-2">- {store.pincode}</span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-2">
                  {store.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <a href={`tel:${store.phone}`} className="text-sm text-blue-600 hover:underline">
                        {store.phone}
                      </a>
                    </div>
                  )}
                  {store.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <a href={`mailto:${store.email}`} className="text-sm text-blue-600 hover:underline">
                        {store.email}
                      </a>
                    </div>
                  )}
                </div>

                {/* Opening Hours */}
                {store.openingHours && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Opening Hours</span>
                    </div>
                    <div className="text-xs text-gray-600 pl-6">
                      <span>{formatOpeningHours(store.openingHours)}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleGetDirections(store)}
                    className="flex-1 bg-amber-600 hover:bg-amber-700"
                    size="sm"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredStores.length === 0 && stores && stores.length > 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stores found</h3>
            <p className="text-gray-600">Try searching with different keywords or check back later.</p>
          </div>
        )}

        {/* No Stores Available */}
        {(!stores || stores.length === 0) && !isLoading && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Store locations coming soon</h3>
            <p className="text-gray-600">We're working on adding store locations. Check back later!</p>
          </div>
        )}
      </div>
    </div>
  );
}