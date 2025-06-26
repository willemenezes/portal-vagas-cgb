import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface Props {
    children: ReactNode;
    fallbackMessage?: string;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <Card className="border-destructive bg-destructive/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            <span>Ocorreu um Erro</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-destructive/90">
                            {this.props.fallbackMessage || "Este componente não pôde ser carregado."}
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <pre className="mt-4 whitespace-pre-wrap text-xs text-destructive/70">
                                {this.state.error.toString()}
                            </pre>
                        )}
                    </CardContent>
                </Card>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 