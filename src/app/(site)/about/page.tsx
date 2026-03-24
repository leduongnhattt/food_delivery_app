import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">About FoodieExpress</h1>
          <p className="text-xl text-muted-foreground">
            Connecting you with the best restaurants in Ho Chi Minh City
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To provide a seamless food delivery experience that connects customers 
                with their favorite local restaurants, ensuring fast delivery and 
                exceptional service quality.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Our Vision</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To become the leading food delivery platform in Vietnam, known for 
                reliability, speed, and customer satisfaction while supporting local 
                businesses and communities.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Why Choose FoodieExpress?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-muted-foreground">
                Average delivery time of 30-45 minutes to your doorstep
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🍽️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Food</h3>
              <p className="text-muted-foreground">
                Partner with the best restaurants ensuring food quality and safety
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Ordering</h3>
              <p className="text-muted-foreground">
                Simple and intuitive ordering process with real-time tracking
              </p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-muted-foreground mb-4">
              FoodieExpress was founded in 2024 with a simple mission: to make food 
              delivery faster, more reliable, and more convenient for everyone in 
              Ho Chi Minh City.
            </p>
            <p className="text-muted-foreground mb-4">
              We started as a small team passionate about connecting local restaurants 
              with customers who love great food. Today, we partner with hundreds of 
              restaurants across the city, from traditional Vietnamese eateries to 
              international cuisine.
            </p>
            <p className="text-muted-foreground">
              Our commitment to quality, speed, and customer satisfaction has made us 
              a trusted name in food delivery. We continue to innovate and improve our 
              service to provide the best experience for both our restaurant partners 
              and customers.
            </p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
          <p className="text-muted-foreground mb-6">
            Have questions or feedback? We'd love to hear from you!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-muted-foreground">support@foodieexpress.com</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Phone</h3>
              <p className="text-muted-foreground">+84 123 456 789</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Address</h3>
              <p className="text-muted-foreground">
                123 Nguyen Hue, District 1<br />
                Ho Chi Minh City, Vietnam
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
