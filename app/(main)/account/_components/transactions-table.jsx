"use client";

import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { categoryColors } from "@/data/categories";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, Clock, RefreshCw , ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import useFetch from '@/hooks/use-fetch';
import { set } from 'mongoose';
import { se } from 'date-fns/locale';



const RECURRING_INTERVALS = {
    DAILY : "Daily" ,
    WEEKLY : "Weekly" ,
    MONTHLY : "Monthly" ,
    YEARLY : "Yearly" ,
};



const TransactionsTable = ({transactions}) => {
    const filteredAndSortedTransactions = transactions ;
    const router = useRouter() ;
    const [selectIds , setSelectIds ] = useState([]) ;
    const [sortConfig , setSortConfig ] = useState({field : "date" , 
        direction : "desc", });
    

    const handleSort = (field) => {
        setSortConfig((current) => ({
            field,
            direction: 
                current.field === field && current.direction === "asc" ? "desc" : "asc"
        }));
    };

    const handleSelect = (id) => {
        setSelectIds((current) => {
            if (current.includes(id)) {
                return current.filter((selectId) => selectId !== id) ;
            } else {
                return [...current, id];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectIds.length === filteredAndSortedTransactions.length) {
            setSelectIds([]) ;
        } else {
            setSelectIds(filteredAndSortedTransactions.map((transaction) => transaction.id)) ;
        }   
    };


    return (
        <TooltipProvider>
        <div className='space-y-4'>
            {/*Filters */}

            {/* Transactions */}
            <div className="rounded-md border">
            <Table>
                <TableCaption>A list of your recent invoices.</TableCaption>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[50px]">
                        <Checkbox onCheckedChange={handleSelectAll} checked={selectIds.length === filteredAndSortedTransactions.length} />
                    </TableHead>
                        
                    <TableHead className="cursor-pointer" onClick={()=> handleSort("date")}><div className="flex items-center">  Date{sortConfig.field==='date' && (
                        sortConfig.direction ==='asc' ? <ChevronUp className='ml-1 h-4 w-4' /> : <ChevronDown className='ml-1 h-4 w-4' />
                    )} </div></TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="cursor-pointer" onClick={()=> handleSort("category")}><div className="flex items-center">  Category {sortConfig.field==='category' && (
                        sortConfig.direction ==='asc' ? <ChevronUp className='ml-1 h-4 w-4' /> : <ChevronDown className='ml-1 h-4 w-4' />
                    )} </div></TableHead>
                    <TableHead className="cursor-pointer" onClick={()=> handleSort("amount")}><div className="flex items-center">  Amount {sortConfig.field === "amount" && (
                        sortConfig.direction ==='asc' ? <ChevronUp className='ml-1 h-4 w-4' /> : <ChevronDown className='ml-1 h-4 w-4' />
                    )} </div></TableHead>
                    <TableHead>Recurring</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredAndSortedTransactions.length === 0? (
                        <TableRow>
                            <TableCell colSpan={7} className=" text-center text-muted-foreground">
                                No transactions found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredAndSortedTransactions.map((transaction) => (    
                        <TableRow key={transaction.id}>
                        <TableCell className="font-medium"><Checkbox onCheckedChange={() => handleSelect(transaction.id)}
                        checked={selectIds.includes(transaction.id)} /></TableCell>
                        <TableCell>{format(new Date(transaction.date),"PP")}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="capitalize">
                            <span style={{background : categoryColors[transaction.category],}} className="px-2 py-1 rounded text-white text-sm"> 
                                {transaction.category}
                            </span> 
                        </TableCell>
                        <TableCell className="text-right font-medium" style={{color : transaction.type === "EXPENSE" ? "#ef4444" : "#22c55e",}}>
                            {transaction.type === "EXPENSE" ? "-" : "+" }${transaction.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                    {transaction.isRecurring ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge
                              variant="secondary"
                              className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200"
                            >
                              <RefreshCw className="h-3 w-3" />
                              {
                                RECURRING_INTERVALS[
                                  transaction.recurringInterval
                                ]
                              }
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <div className="font-medium">Next Date:</div>
                              <div>
                                {format(
                                  new Date(transaction.nextRecurringDate),
                                  "PPP"
                                )}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        One-time
                      </Badge>
                    )}
                    </TableCell>
                    <TableCell>
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                    
                        <DropdownMenuLabel onClick={() => router.push(`/transaction/create?edit=${transaction.id}`)} >Edit</DropdownMenuLabel>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={()=> deleteFn([transaction.id])}>Delete</DropdownMenuItem>

                    </DropdownMenuContent>
                    </DropdownMenu>
                    </TableCell>    
                    </TableRow>
                    )))}
                </TableBody>
                </Table>
            </div>
        </div>
        </TooltipProvider>
    );
}
export default TransactionsTable;