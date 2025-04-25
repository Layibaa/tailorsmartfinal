import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator
} from 'react-native';

const TailorDetailScreen = ({ route, navigation }) => {
  const { tailorId } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [tailor, setTailor] = useState(null);

  // Sample data - in a real app, this would come from an API
  const tailorData = [
    { 
      id: '1', 
      name: 'John Smith', 
      rating: 4.8, 
      specialty: 'Suits & Formal Wear',
      location: 'New York, NY',
      experience: '12 years',
      bio: 'Expert tailor with over a decade of experience in high-end suits and formal wear. Trained in London and worked for several luxury fashion houses before starting my own business.',
      services: [
        { name: 'Custom Suit', price: '$850+' },
        { name: 'Suit Alterations', price: '$150+' },
        { name: 'Formal Shirt', price: '$120+' },
        { name: 'Pants Hemming', price: '$35' }
      ],
      reviews: [
        { id: '1', user: 'Michael B.', rating: 5, comment: 'Excellent work on my wedding suit. Fit was perfect!', date: '2 weeks ago' },
        { id: '2', user: 'Sarah T.', rating: 4, comment: 'Great quality alterations, slightly expensive but worth it.', date: '1 month ago' },
        { id: '3', user: 'David R.', rating: 5, comment: 'John made me the best suit I\'ve ever owned. Will definitely return.', date: '2 months ago' }
      ]
    },
    { 
      id: '2', 
      name: 'Maria Garcia', 
      rating: 4.7, 
      specialty: 'Dresses & Skirts',
      location: 'Los Angeles, CA',
      experience: '8 years',
      bio: 'Specializing in women\'s clothing with a focus on dresses and formal wear. My designs blend modern trends with classic techniques for a perfect fit and unique style.',
      services: [
        { name: 'Custom Dress', price: '$350+' },
        { name: 'Dress Alterations', price: '$85+' },
        { name: 'Skirt Creation', price: '$180+' },
        { name: 'Hem Adjustment', price: '$40' }
      ],
      reviews: [
        { id: '1', user: 'Jennifer L.', rating: 5, comment: 'Maria made my dream wedding dress! Absolutely stunning!', date: '3 weeks ago' },
        { id: '2', user: 'Emma K.', rating: 4, comment: 'Beautiful work on my gown alterations. Pricing was fair.', date: '2 months ago' },
        { id: '3', user: 'Laura M.', rating: 5, comment: 'The custom dress Maria made for my daughter\'s graduation was perfect.', date: '3 months ago' }
      ]
    },
    { 
      id: '3', 
      name: 'David Lee', 
      rating: 4.9, 
      specialty: 'Custom Designs',
      location: 'Chicago, IL',
      experience: '15 years',
      bio: 'Award-winning designer with a passion for creating unique, custom clothing. My approach combines traditional craftsmanship with innovative design concepts.',
      services: [
        { name: 'Custom Design Consultation', price: '$100' },
        { name: 'Bespoke Suit', price: '$1200+' },
        { name: 'Custom Evening Wear', price: '$800+' },
        { name: 'Tailored Casual Wear', price: '$350+' }
      ],
      reviews: [
        { id: '1', user: 'Robert J.', rating: 5, comment: 'David created an amazing suit that\'s unlike anything off the rack. Worth every penny!', date: '1 week ago' },
        { id: '2', user: 'Sophia C.', rating: 5, comment: 'His attention to detail is incredible. My dress was absolute perfection.', date: '1 month ago' },
        { id: '3', user: 'Thomas W.', rating: 5, comment: 'World-class tailoring. David is a true artist.', date: '2 months ago' }
      ]
    },
    { 
      id: '4', 
      name: 'Sophia Rodriguez', 
      rating: 4.5, 
      specialty: 'Alterations & Repairs',
      location: 'Miami, FL',
      experience: '7 years',
      bio: 'Skilled in all types of clothing alterations and repairs. I bring new life to your favorite pieces with careful attention to preserving the original design while improving fit.',
      services: [
        { name: 'Basic Alterations', price: '$25+' },
        { name: 'Suit/Dress Tailoring', price: '$75+' },
        { name: 'Zipper Replacement', price: '$35+' },
        { name: 'Clothing Repair', price: '$20+' }
      ],
      reviews: [
        { id: '1', user: 'Carlos M.', rating: 4, comment: 'Quick service and good quality work on my pants alterations.', date: '2 weeks ago' },
        { id: '2', user: 'Nina P.', rating: 5, comment: 'Sophia saved my vintage dress! The repairs are invisible.', date: '1 month ago' },
        { id: '3', user: 'Alex T.', rating: 4, comment: 'Fair pricing and reliable service. Will use again.', date: '3 months ago' }
      ]
    },
    { 
      id: '5', 
      name: 'James Wilson', 
      rating: 4.6, 
      specialty: 'Wedding Attire',
      location: 'Boston, MA',
      experience: '10 years',
      bio: 'Specializing in wedding attire for all genders. My goal is to make sure you look and feel your best on your special day with perfectly tailored formal wear.',
      services: [
        { name: 'Wedding Dress Alterations', price: '$200+' },
        { name: 'Wedding Suit Tailoring', price: '$150+' },
        { name: 'Bridesmaid Dress Alterations', price: '$85+' },
        { name: 'Rush Service', price: '+50%' }
      ],
      reviews: [
        { id: '1', user: 'Rachel B.', rating: 5, comment: 'James altered my wedding dress to perfection! Couldn\'t be happier.', date: '3 weeks ago' },
        { id: '2', user: 'Kevin L.', rating: 4, comment: 'Great job on the groomsmen suits. Everyone looked sharp!', date: '2 months ago' },
        { id: '3', user: 'Melissa J.', rating: 5, comment: 'Worth every penny for the quality of work on my wedding gown.', date: '4 months ago' }
      ]
    },
  ];

  useEffect(() => {
    // Simulate API call to get tailor details
    setTimeout(() => {
      const selectedTailor = tailorData.find(t => t.id === tailorId);
      setTailor(selectedTailor);
      setIsLoading(false);
    }, 1000);
  }, [tailorId]);

  const renderServiceItem = (service, index) => (
    <View key={index} style={styles.serviceItem}>
      <Text style={styles.serviceName}>{service.name}</Text>
      <Text style={styles.servicePrice}>{service.price}</Text>
    </View>
  );

  const renderReviewItem = (review) => (
    <View key={review.id} style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewUser}>{review.user}</Text>
        <Text style={styles.reviewRating}>{'★'.repeat(review.rating)}</Text>
      </View>
      <Text style={styles.reviewComment}>{review.comment}</Text>
      <Text style={styles.reviewDate}>{review.date}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading tailor details...</Text>
      </View>
    );
  }

  if (!tailor) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Tailor not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.tailorImagePlaceholder}>
          <Text style={styles.tailorInitials}>{tailor.name.charAt(0)}</Text>
        </View>
        <Text style={styles.tailorName}>{tailor.name}</Text>
        <Text style={styles.tailorRating}>{'★'.repeat(Math.floor(tailor.rating))} {tailor.rating}</Text>
        <Text style={styles.tailorSpecialty}>{tailor.specialty}</Text>
        <View style={styles.tailorDetails}>
          <Text style={styles.tailorLocation}>📍 {tailor.location}</Text>
          <Text style={styles.tailorExperience}>⏱️ {tailor.experience}</Text>
        </View>
      </View>
      
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.bioText}>{tailor.bio}</Text>
      </View>
      
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Services & Pricing</Text>
        <View style={styles.servicesList}>
          {tailor.services.map(renderServiceItem)}
        </View>
      </View>
      
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        <View style={styles.reviewsList}>
          {tailor.reviews.map(renderReviewItem)}
        </View>
      </View>
      
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('NewOrder', { tailorId: tailor.id })}
        >
          <Text style={styles.actionButtonText}>Create Order</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('Chat', { 
            recipientId: tailor.id,
            recipientName: tailor.name 
          })}
        >
          <Text style={styles.secondaryButtonText}>Message</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9F9F9',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  profileHeader: {
    backgroundColor: '#4A90E2',
    padding: 30,
    alignItems: 'center',
  },
  tailorImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  tailorInitials: {
    fontSize: 40,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  tailorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  tailorRating: {
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 5,
  },
  tailorSpecialty: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 10,
  },
  tailorDetails: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  tailorLocation: {
    fontSize: 14,
    color: 'white',
    marginRight: 15,
  },
  tailorExperience: {
    fontSize: 14,
    color: 'white',
  },
  sectionContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  bioText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  servicesList: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  serviceName: {
    fontSize: 16,
    color: '#333',
  },
  servicePrice: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '500',
  },
  reviewsList: {
    marginTop: 5,
  },
  reviewItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewUser: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  reviewRating: {
    fontSize: 16,
    color: '#FFB800',
  },
  reviewComment: {
    fontSize: 15,
    color: '#555',
    marginBottom: 8,
    lineHeight: 22,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  actionContainer: {
    padding: 20,
    marginTop: 15,
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 15,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  secondaryButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TailorDetailScreen;