"use client";

import React, { useEffect, useMemo } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { categoryColors } from "@/data/categories";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, Clock, RefreshCw , ChevronDown, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import useFetch from '@/hooks/use-fetch';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash, ChevronLeft, ChevronRight } from 'lucide-react';
import { bulkDeleteTransactions } from '@/actions/accounts';
import { toast } from 'sonner';
import { BarLoader } from 'react-spinners';


const RECURRING_INTERVALS = {
    DAILY : "Daily" ,
    WEEKLY : "Weekly" ,
    MONTHLY : "Monthly" ,
    YEARLY : "Yearly" ,
};

const TransactionsTable = ({transactions}) => {
    const router = useRouter() ;
    const [selectIds , setSelectIds ] = useState([]) ;
    const [sortConfig , setSortConfig ] = useState({field : "date" , 
        direction : "desc", });
    
    const [searchTerm,  setSearchTerm ] = useState("") ;
    const [typeFilter , setTypeFilter] = useState("");
    const [recurringFilter , setRecurringFilter] = useState("") ;
    const [currentPage, setCurrentPage] = useState(1) ;
    const itemsPerPage = 10 ;

    const {
        loading : deleteLoading , fn : deleteFn , data: deleted
    } = useFetch(bulkDeleteTransactions);

    const handleBulkDelete = () => {
        if(!window.confirm(`Are you sure you want to delete ${selectIds.length} transactions? This action cannot be undone.`)) {
            return ;
        }
        deleteFn(selectIds) ;
        setSelectIds([]) ;

    };

    useEffect(() => {
        if (deleted && !deleteLoading) {
            toast.success("Transactions deleted successfully") ;
            router.refresh() ;
        }
    }, [deleted, deleteLoading, router]);

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

    

    const handleClearFilters = () => {
        setSearchTerm("") ;
        setTypeFilter("") ;
        setRecurringFilter("") ;
        setSelectIds([]) ;
        setCurrentPage(1) ;
    }
    
    const filteredAndSortedTransactions = useMemo(() => {
        let result = [...transactions]    ;

        // applying the search filter 
        if (searchTerm) {
            result = result.filter((transaction) =>
                transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
            ) ;
        }

        // recurring filter
        if (recurringFilter) {
            result = result.filter((transaction) => 
                recurringFilter === "recurring" ? transaction.isRecurring : !transaction.isRecurring
            ) ;
        }
        // type filter
        if (typeFilter) {
            result = result.filter((transaction) => transaction.type === typeFilter) ;
        }
        // sorting
        result.sort((a, b) => {
            let comparison = 0 ;
            switch (sortConfig.field) {
                case "date" :
                    comparison = new Date(a.date) - new Date(b.date) ;
                    break ;
                case "amount" :
                    comparison = a.amount - b.amount ;
                    break ;
                case "category" :
                    comparison = a.category.localeCompare(b.category) ;
                    break ;
                default :
                    comparison = 0 ;
                }
        
            return sortConfig.direction === "asc" ? comparison : -comparison ;
        }) ;

        return result ;
    }, [transactions, searchTerm , typeFilter , recurringFilter , sortConfig]) ;

    // Pagination logic
    const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage) ;
    const startIndex = (currentPage - 1) * itemsPerPage ;
    const endIndex = startIndex + itemsPerPage ;
    const paginatedTransactions = filteredAndSortedTransactions.slice(startIndex, endIndex) ;

    // Reset to page 1 if current page exceeds total pages
    React.useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1) ;
        }
    }, [totalPages, currentPage]) ;

    return (
        <TooltipProvider>
        <div className='space-y-4'>
            {deleteLoading && <BarLoader width={"100%"} color="#9333ea" loading={deleteLoading} />}
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => {
                    setSearchTerm(e.target.value);
                    
                    }}
                    className="pl-8"
                />
                </div>
                <div className="flex gap-2">
                <Select
                    value={typeFilter}
                    onValueChange={(value) => {
                    setTypeFilter(value);
                    }}
                >
                    <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="INCOME">Income</SelectItem>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={recurringFilter}
                    onValueChange={(value) => {
                    setRecurringFilter(value);
                    }}
                >
                    <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="All Transactions" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="recurring">Recurring Only</SelectItem>
                    <SelectItem value="non-recurring">Non-recurring Only</SelectItem>
                    </SelectContent>
                </Select>

                {/* Bulk Actions */}
                {selectIds.length > 0 && (
                    <div className="flex items-center gap-2">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                    >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete Selected ({selectIds.length})
                    </Button>
                    </div>
                )}

                {(searchTerm || typeFilter || recurringFilter) && (
                    <Button
                    variant="outline"
                    size="icon"
                    onClick={handleClearFilters}
                    title="Clear filters"
                    >
                    <X className="h-4 w-5" />
                    </Button>
                )}
                </div>
            </div>

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
                        paginatedTransactions.map((transaction) => (    
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
                    
                        <DropdownMenuLabel onClick={() => router.push(`/transaction/create?edited=${transaction.id}`)} >Edit</DropdownMenuLabel>

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

            {/* Pagination Controls */}
            {filteredAndSortedTransactions.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedTransactions.length)} of {filteredAndSortedTransactions.length} transactions
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">
                                Page {currentPage} of {totalPages}
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
        </TooltipProvider>
    );
}
export default TransactionsTable;