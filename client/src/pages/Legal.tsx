import Navigation from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Legal() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 container mx-auto px-4 max-w-4xl pb-20">
        <h1 className="text-5xl font-bold text-foreground mb-4">Legal & Compliance</h1>
        <p className="text-muted-foreground mb-12">
          Important legal information regarding the use of this platform
        </p>

        <Tabs defaultValue="tos" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="tos">Terms of Service</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
            <TabsTrigger value="dmca">DMCA Disclaimer</TabsTrigger>
          </TabsList>

          {/* Terms of Service */}
          <TabsContent value="tos" className="space-y-6">
            <div className="card-premium space-y-6">
              <h2 className="text-3xl font-bold text-foreground">Terms of Service</h2>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">1. Acceptance of Terms</h3>
                <p className="text-muted-foreground">
                  By accessing and using this CazeTV World Cup 2026 Proxy platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">2. Use License</h3>
                <p className="text-muted-foreground">
                  Permission is granted to temporarily download one copy of the materials (information or software) on this platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose or for any public display</li>
                  <li>Attempt to decompile or reverse engineer any software contained on the platform</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                  <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                  <li>Attempt to gain unauthorized access to any portion or feature of the platform</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">3. Disclaimer</h3>
                <p className="text-muted-foreground">
                  The materials on this platform are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">4. Limitations</h3>
                <p className="text-muted-foreground">
                  In no event shall this platform or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the platform, even if we or our authorized representative has been notified orally or in writing of the possibility of such damage.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">5. Accuracy of Materials</h3>
                <p className="text-muted-foreground">
                  The materials appearing on this platform could include technical, typographical, or photographic errors. We do not warrant that any of the materials on the platform are accurate, complete, or current. We may make changes to the materials contained on the platform at any time without notice.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">6. Links</h3>
                <p className="text-muted-foreground">
                  We have not reviewed all of the sites linked to our website and are not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by us of the site. Use of any such linked website is at the user's own risk.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">7. Modifications</h3>
                <p className="text-muted-foreground">
                  We may revise these terms of service for the platform at any time without notice. By using this platform, you are agreeing to be bound by the then current version of these terms of service.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">8. Governing Law</h3>
                <p className="text-muted-foreground">
                  These terms and conditions are governed by and construed in accordance with the laws of Bangladesh, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
                </p>
              </section>
            </div>
          </TabsContent>

          {/* Privacy Policy */}
          <TabsContent value="privacy" className="space-y-6">
            <div className="card-premium space-y-6">
              <h2 className="text-3xl font-bold text-foreground">Privacy Policy</h2>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">1. Introduction</h3>
                <p className="text-muted-foreground">
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform, including all associated features and functionalities.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">2. Information We Collect</h3>
                <p className="text-muted-foreground">
                  We may collect information about you in a variety of ways. The information we may collect on the platform includes:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, that you voluntarily give to us when you register with the platform</li>
                  <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the platform, such as your IP address, your browser type, your operating system, your location, and your usage data</li>
                  <li><strong>Financial Data:</strong> Financial information, such as data related to your payment method (e.g., valid credit card number, card brand, expiration date) that we may collect when you purchase services on the platform</li>
                  <li><strong>Data From Third Parties:</strong> Information we receive from third parties, including but not limited to payment processors and analytics providers</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">3. Use of Your Information</h3>
                <p className="text-muted-foreground">
                  Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the platform to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Generate a personal profile about you so that future visits to the platform are personalized</li>
                  <li>Increase the efficiency and operation of the platform</li>
                  <li>Monitor and analyze usage and trends to improve your experience with the platform</li>
                  <li>Notify you of updates to the platform</li>
                  <li>Offer new products, services, and/or recommendations to you</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">4. Disclosure of Your Information</h3>
                <p className="text-muted-foreground">
                  We may share information we have collected about you in certain situations:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information is necessary to comply with the law</li>
                  <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us</li>
                  <li><strong>Business Transfers:</strong> Your information may be transferred as part of our business assets in a merger, acquisition, or other transaction</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">5. Security of Your Information</h3>
                <p className="text-muted-foreground">
                  We use administrative, technical, and physical security measures to protect your personal information. However, despite our efforts, no security measures are completely secure.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">6. Contact Us</h3>
                <p className="text-muted-foreground">
                  If you have questions or comments about this Privacy Policy, please contact us through the official CazeTV YouTube channel or visit our support page.
                </p>
              </section>
            </div>
          </TabsContent>

          {/* DMCA Disclaimer */}
          <TabsContent value="dmca" className="space-y-6">
            <div className="card-premium space-y-6">
              <h2 className="text-3xl font-bold text-foreground">DMCA & Fair Use Disclaimer</h2>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">1. Broadcast Rights Attribution</h3>
                <p className="text-muted-foreground">
                  <strong>All broadcast rights for FIFA World Cup 2026 matches belong 100% to CazeTV.</strong> This platform serves as a proxy viewer for CazeTV's official YouTube broadcasts and does not claim any ownership of the broadcast content.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">2. Fair Use Notice</h3>
                <p className="text-muted-foreground">
                  This platform operates under the Fair Use doctrine as outlined in Section 107 of the Copyright Act. The platform provides a transparent proxy mechanism to access content that is already publicly available on YouTube, enabling users to view broadcasts without geographic restrictions while maintaining full attribution to the original copyright holder (CazeTV).
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">3. No Copyright Infringement</h3>
                <p className="text-muted-foreground">
                  This platform does not:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Store, download, or distribute copyrighted content</li>
                  <li>Modify or alter the original broadcasts</li>
                  <li>Claim ownership of any broadcast content</li>
                  <li>Remove or obscure copyright notices or attribution</li>
                  <li>Compete with CazeTV's official distribution channels</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">4. Proxy Technology</h3>
                <p className="text-muted-foreground">
                  This platform uses server-side proxy technology to transparently tunnel YouTube stream requests through a Brazilian residential proxy endpoint. This technology enables geographic access to content that is already publicly available, without modifying, copying, or redistributing the original content.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">5. DMCA Compliance</h3>
                <p className="text-muted-foreground">
                  We respect intellectual property rights and comply with the Digital Millennium Copyright Act (DMCA). If you believe that content on this platform infringes your copyright, please contact CazeTV directly at their official YouTube channel: <a href="https://www.youtube.com/@CazeTV" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80">https://www.youtube.com/@CazeTV</a>
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">6. Takedown Procedure</h3>
                <p className="text-muted-foreground">
                  If CazeTV or FIFA requests removal of content or shutdown of this platform, we will comply immediately. This platform exists solely to provide transparent access to publicly available broadcasts and respects all copyright holder requests.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">7. No Warranty</h3>
                <p className="text-muted-foreground">
                  This platform is provided "as is" without warranty of any kind. We do not guarantee uninterrupted access or availability of broadcasts. Availability and quality depend on CazeTV's official broadcasts and network conditions.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">8. Official CazeTV Channel</h3>
                <p className="text-muted-foreground">
                  For official broadcasts and content, please visit the official CazeTV YouTube channel:
                </p>
                <a
                  href="https://www.youtube.com/@CazeTV"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block btn-premium text-sm py-2 px-4"
                >
                  Visit CazeTV YouTube Channel
                </a>
              </section>
            </div>
          </TabsContent>
        </Tabs>

        {/* Broadcast Rights Attribution */}
        <div className="mt-16 card-premium bg-card/50 border-accent/30">
          <h3 className="text-2xl font-bold text-foreground mb-4">Broadcast Rights Attribution</h3>
          <p className="text-muted-foreground mb-6">
            All broadcast rights for FIFA World Cup 2026 matches belong 100% to CazeTV. This platform is an independent proxy viewer designed to provide transparent access to publicly available broadcasts. We are not affiliated with FIFA, CazeTV, or any official tournament organizer.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <strong>Official CazeTV Channel:</strong>
            </p>
            <a
              href="https://www.youtube.com/@CazeTV"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-medium"
            >
              https://www.youtube.com/@CazeTV →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
