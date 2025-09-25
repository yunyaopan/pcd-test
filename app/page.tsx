import { Navigation } from "@/components/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Settings, Upload } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <Navigation />
        
        <div className="flex-1 flex flex-col gap-12 max-w-6xl p-8 w-full">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              AI-Assisted Procurement Experience
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Streamline your procurement process with intelligent document management, 
              automated evaluation criteria, and seamless project coordination.
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
            {/* PCD Team Card */}
            <Card className="hover:shadow-lg transition-shadow duration-300 border-2 hover:border-indigo-200">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <Settings className="w-8 h-8 text-indigo-600" />
                </div>
                <CardTitle className="text-2xl text-indigo-700">PCD Team</CardTitle>
                <CardDescription className="text-gray-600">
                  Document owners and template controllers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm text-gray-700">Control document templates</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm text-gray-700">Edit TCB paper formats</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm text-gray-700">Manage document standards</span>
                  </div>
                </div>
                <Link href="/protected/templates" className="block">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                    Access Template Management
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Project OIC Card */}
            <Card className="hover:shadow-lg transition-shadow duration-300 border-2 hover:border-green-200">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-700">Project OIC</CardTitle>
                <CardDescription className="text-gray-600">
                  Project managers and procurement officers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700">Select evaluation criteria</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Upload className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700">Upload project documents</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700">Generate TCB papers</span>
                  </div>
                </div>
                <Link href="/protected/projects" className="block">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Access Project Management
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Features Section */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Key Features</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="p-4 bg-white/60 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Smart Templates</h3>
                <p className="text-sm text-gray-600">AI-powered document templates with dynamic parameter replacement</p>
              </div>
              <div className="p-4 bg-white/60 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Automated Evaluation</h3>
                <p className="text-sm text-gray-600">Streamlined evaluation criteria selection and scoring</p>
              </div>
              <div className="p-4 bg-white/60 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Document Generation</h3>
                <p className="text-sm text-gray-600">Automated TCB paper generation with project data integration</p>
              </div>
            </div>
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16 bg-white/80 backdrop-blur-sm">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
