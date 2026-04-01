
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface CustomerSpendingChartProps {
    data: { month: string, total: number }[];
}

export function CustomerSpendingChart({ data }: CustomerSpendingChartProps) {
    return (
        <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50">
                <CardTitle className="text-xl font-black tracking-tight">Tendance d'achat</CardTitle>
                <CardDescription className="font-medium">Évolution des achats sur les 6 derniers mois.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                        <XAxis 
                            dataKey="month" 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontWeight: 'bold' }}
                        />
                        <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip 
                            cursor={{ fill: 'hsl(var(--muted) / 0.5)', radius: 8 }}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                            }}
                            formatter={(value: number) => [formatCurrency(value), 'Dépenses']}
                        />
                        <Bar 
                            dataKey="total" 
                            fill="url(#colorTotal)" 
                            radius={[6, 6, 0, 0]} 
                            barSize={30}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
