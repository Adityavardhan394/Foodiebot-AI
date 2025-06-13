// ===== LOCATION SERVICES FOR RESTAURANT DISCOVERY =====

class LocationService {
    constructor() {
        this.currentLocation = {
            name: "Nagaram, Dammiguda",
            coordinates: { lat: 17.4875, lng: 78.5398 },
            pincode: "500090",
            area: "Nagaram-Dammiguda"
        };
        this.deliveryRadius = 5; // km
        this.supportedAreas = this.initializeSupportedAreas();
        this.init();
    }

    init() {
        this.bindLocationEvents();
        this.updateLocationDisplay();
    }

    initializeSupportedAreas() {
        return [
            {
                name: "Nagaram, Dammiguda",
                coordinates: { lat: 17.4875, lng: 78.5398 },
                pincode: "500090",
                deliveryFee: 30,
                popular: true
            },
            {
                name: "Uppal, Hyderabad",
                coordinates: { lat: 17.4065, lng: 78.5691 },
                pincode: "500039",
                deliveryFee: 40,
                popular: true
            },
            {
                name: "Kompally, Hyderabad",
                coordinates: { lat: 17.5410, lng: 78.4890 },
                pincode: "500014",
                deliveryFee: 45,
                popular: true
            },
            {
                name: "Bachupally, Hyderabad",
                coordinates: { lat: 17.5067, lng: 78.4203 },
                pincode: "500090",
                deliveryFee: 50,
                popular: true
            },
            {
                name: "Tarnaka, Hyderabad",
                coordinates: { lat: 17.4239, lng: 78.5421 },
                pincode: "500017",
                deliveryFee: 35,
                popular: true
            }
        ];
    }

    bindLocationEvents() {
        document.getElementById('changeLocation')?.addEventListener('click', () => {
            this.showLocationModal();
        });

        document.getElementById('useLocation')?.addEventListener('click', () => {
            this.detectCurrentLocation();
        });

        document.getElementById('confirmLocation')?.addEventListener('click', () => {
            this.confirmLocationChange();
        });

        document.querySelectorAll('.location-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                this.selectLocationChip(e.target);
            });
        });
    }

    showLocationModal() {
        const modal = document.getElementById('locationModal');
        modal.classList.remove('hidden');
    }

    async detectCurrentLocation() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingOverlay && loadingText) {
            loadingText.textContent = 'Detecting your location...';
            loadingOverlay.classList.remove('hidden');
        }

        try {
            if (navigator.geolocation) {
                const position = await this.getCurrentPosition();
                const detectedLocation = this.findNearestSupportedArea(
                    position.coords.latitude, 
                    position.coords.longitude
                );
                this.updateLocation(detectedLocation);
                this.showNotification('📍 Location detected successfully!', 'success');
            } else {
                throw new Error('Geolocation not supported');
            }
        } catch (error) {
            this.showNotification('❌ Could not detect location. Please select manually.', 'error');
        } finally {
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            });
        });
    }

    findNearestSupportedArea(lat, lng) {
        let nearest = this.supportedAreas[0];
        let minDistance = this.calculateDistance(lat, lng, nearest.coordinates.lat, nearest.coordinates.lng);

        for (const area of this.supportedAreas) {
            const distance = this.calculateDistance(lat, lng, area.coordinates.lat, area.coordinates.lng);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = area;
            }
        }

        return {
            name: nearest.name,
            coordinates: nearest.coordinates,
            pincode: nearest.pincode,
            area: nearest.name.split(',')[0]
        };
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    selectLocationChip(chip) {
        document.querySelectorAll('.location-chip').forEach(c => 
            c.classList.remove('active')
        );
        chip.classList.add('active');
        
        const locationName = chip.dataset.location;
        const searchInput = document.getElementById('locationSearch');
        if (searchInput) {
            searchInput.value = locationName;
        }
    }

    confirmLocationChange() {
        const searchInput = document.getElementById('locationSearch');
        const selectedLocation = searchInput?.value;
        
        if (selectedLocation) {
            const area = this.supportedAreas.find(area => 
                area.name === selectedLocation
            );
            
            if (area) {
                this.updateLocation({
                    name: area.name,
                    coordinates: area.coordinates,
                    pincode: area.pincode,
                    area: area.name.split(',')[0]
                });
                this.closeLocationModal();
                this.showNotification('✅ Delivery location updated!', 'success');
            }
        }
    }

    closeLocationModal() {
        const modal = document.getElementById('locationModal');
        modal.classList.add('hidden');
    }

    updateLocation(newLocation) {
        this.currentLocation = newLocation;
        this.updateLocationDisplay();
        
        if (window.chatbotAI) {
            window.chatbotAI.currentLocation = newLocation.name;
        }
    }

    updateLocationDisplay() {
        const locationName = document.querySelector('.location-name');
        if (locationName) {
            locationName.textContent = this.currentLocation.name;
        }

        const deliveryAddress = document.getElementById('deliveryAddress');
        if (deliveryAddress) {
            deliveryAddress.innerHTML = `
                <p><strong>Current Location:</strong></p>
                <p>${this.currentLocation.name}</p>
                <button class="btn-link" id="changeAddress">Change Address</button>
            `;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    getNotificationColor(type) {
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            warning: '#ed8936',
            info: '#4299e1'
        };
        return colors[type] || colors.info;
    }

    getCurrentLocation() {
        return this.currentLocation;
    }

    getDeliveryFee() {
        const area = this.supportedAreas.find(a => a.name === this.currentLocation.name);
        return area ? area.deliveryFee : 40;
    }
}

// Initialize location service when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.locationService = new LocationService();
});
