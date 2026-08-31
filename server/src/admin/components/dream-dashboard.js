import React, { useEffect, useState } from 'react';
import { ApiClient } from 'adminjs';
import { Box, H1, H2, Text, Loader, MessageBox } from '@adminjs/design-system';

const api = new ApiClient();
const cardStyle = {
    background: '#fff',
    border: '1px solid #eceaf8',
    borderRadius: 16,
    boxShadow: '0 8px 24px rgba(52,45,113,.06)',
    padding: 24
};
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 };

const StatCard = ({ label, value, hint }) =>
    React.createElement(
        Box,
        { style: cardStyle },
        React.createElement(Text, { color: 'grey60', mb: 'sm' }, label),
        React.createElement(H2, { mb: 'sm', style: { color: '#322b6c', fontSize: 34 } }, String(value ?? 0)),
        hint ? React.createElement(Text, { color: 'grey60', fontSize: 'sm' }, hint) : null
    );

const DreamDashboard = () => {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        api.getDashboard()
            .then(({ data }) => setStats(data))
            .catch(() => setError('统计数据加载失败，请刷新页面重试。'));
    }, []);
    if (error)
        return React.createElement(
            Box,
            { p: 'xl' },
            React.createElement(MessageBox, { message: error, variant: 'danger' })
        );
    if (!stats)
        return React.createElement(Box, { p: 'xxl', style: { textAlign: 'center' } }, React.createElement(Loader));
    return React.createElement(
        Box,
        { p: ['lg', 'xxl'], style: { background: '#f8f7fc', minHeight: '100%' } },
        React.createElement(H1, { mb: 'sm' }, '梦境数据概览'),
        React.createElement(
            Text,
            { color: 'grey60', mb: 'xl' },
            `统计更新时间：${new Date(stats.generatedAt).toLocaleString('zh-CN')}`
        ),
        React.createElement(
            Box,
            { style: gridStyle, mb: 'xl' },
            React.createElement(StatCard, { label: '全部梦境记录', value: stats.total, hint: 'dreams 表物理记录数' }),
            React.createElement(StatCard, { label: '有效梦境', value: stats.active, hint: '排除状态删除和软删除' }),
            React.createElement(StatCard, { label: '已删除', value: stats.deleted, hint: '状态删除或存在删除时间' }),
            React.createElement(StatCard, { label: '用户数', value: stats.users })
        ),
        React.createElement(H2, { mb: 'lg' }, '新增趋势'),
        React.createElement(
            Box,
            { style: gridStyle, mb: 'xl' },
            React.createElement(StatCard, { label: '今日新增', value: stats.today }),
            React.createElement(StatCard, { label: '近 7 日新增', value: stats.last7Days }),
            React.createElement(StatCard, { label: '近 30 日新增', value: stats.last30Days })
        ),
        React.createElement(H2, { mb: 'lg' }, '状态分布'),
        React.createElement(
            Box,
            { style: gridStyle },
            React.createElement(StatCard, { label: '待解析', value: stats.byStatus.pending }),
            React.createElement(StatCard, { label: '已解析', value: stats.byStatus.analyzed }),
            React.createElement(StatCard, { label: '删除状态', value: stats.byStatus.deleted }),
            React.createElement(StatCard, { label: '公开梦境', value: stats.publicDreams }),
            React.createElement(StatCard, { label: '私密梦境', value: stats.privateDreams })
        )
    );
};

export default DreamDashboard;
