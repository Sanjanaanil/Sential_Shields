import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
            email: username,   // or rename your input field to email
            password: password
        },
        {
          withCredentials: true,
        }
      );

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      // Navigate based on backend response if needed
      navigate("/dashboard");

    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description:
          error.response?.data?.message || "Invalid username or password",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 rounded-lg border bg-card shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">
          Sentinel Shield Login
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="text-sm">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Authenticating..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;